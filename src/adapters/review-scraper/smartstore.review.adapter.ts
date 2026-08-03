import { chromium } from 'playwright';
import { ReviewItem } from '../../types/intelligence-types';
import { ReviewScraperPort } from './review-scraper.port';

export class SmartStoreReviewAdapter implements ReviewScraperPort {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  ];

  async scrapeReviews(url: string, maxReviews = 300): Promise<ReviewItem[]> {
    console.log(`🕷️  [ReviewCollector] Starting real review scraping on: ${url} (Max: ${maxReviews})`);

    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      timeout: 30000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const context = await browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 800 },
        locale: 'ko-KR',
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      const page = await context.newPage();

      let queryPagesReqBody: any = null;
      page.on('request', (req) => {
        const u = req.url();
        if (u.includes('query-pages')) {
          try {
            queryPagesReqBody = JSON.parse(req.postData() || '{}');
          } catch {}
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2000);

      // Scroll down to trigger review API
      for (let i = 0; i < 8; i++) {
        await page.evaluate(function () {
          window.scrollBy(0, 1500);
        });
        await page.waitForTimeout(400);
      }
      await page.waitForTimeout(1500);

      // Attempt 1: Fetch reviews via Naver review query-pages API in page context
      let reviews: ReviewItem[] = [];

      if (!queryPagesReqBody) {
        // Try extracting merchantNo & productNo from __PRELOADED_STATE__
        queryPagesReqBody = await page.evaluate(function () {
          const w = window as any;
          const state = w.__PRELOADED_STATE__;
          if (!state) return null;
          let merchantNo = 0;
          let productNo = 0;
          const jsonStr = JSON.stringify(state);
          const mMatch = jsonStr.match(/"checkoutMerchantNo"\s*:\s*(\d+)/) || jsonStr.match(/"merchantNo"\s*:\s*(\d+)/);
          const pMatch = jsonStr.match(/"originProductNo"\s*:\s*(\d+)/) || jsonStr.match(/"productNo"\s*:\s*(\d+)/);
          if (mMatch) merchantNo = Number(mMatch[1]);
          if (pMatch) productNo = Number(pMatch[1]);
          if (merchantNo && productNo) {
            return {
              checkoutMerchantNo: merchantNo,
              originProductNo: productNo,
              page: 1,
              pageSize: 30,
              reviewSearchSortType: 'REVIEW_RANKING',
            };
          }
          return null;
        });
      }

      if (queryPagesReqBody) {
        const pagesToFetch = Math.ceil(maxReviews / 30);
        console.log(`🚀 [ReviewCollector] Discovered API payload. Fetching ${pagesToFetch} pages via browser fetch...`);

        const apiReviews = await page.evaluate(
          async function ({ body, pagesToFetch }) {
            const resultList: any[] = [];
            for (let p = 1; p <= pagesToFetch; p++) {
              try {
                const res = await fetch('/n/v1/contents/reviews/query-pages', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...body,
                    page: p,
                    pageSize: 30,
                  }),
                });
                const data = await res.json();
                const items = data.contents || [];
                if (items.length === 0) break;

                for (let i = 0; i < items.length; i++) {
                  const r = items[i];
                  resultList.push({
                    reviewId: String(r.id || `rev_${p}_${i}`),
                    reviewText: r.reviewContent || '',
                    rating: Number(r.reviewScore || 5),
                    createdAt: r.createDate || new Date().toISOString(),
                    option: r.productOptionContent || '',
                    isVerifiedPurchase: true,
                    helpfulCount: Number(r.helpCount || 0),
                    hasImage: !!(r.reviewContentClassType === 'PHOTO' || r.reviewContentClassType === 'VIDEO'),
                  });
                }
              } catch {
                break;
              }
            }
            return resultList;
          },
          { body: queryPagesReqBody, pagesToFetch }
        );

        if (apiReviews && apiReviews.length > 0) {
          console.log(`✅ [ReviewCollector] Successfully collected ${apiReviews.length} real reviews from API.`);
          reviews = apiReviews.slice(0, maxReviews);
        }
      }

      // Attempt 2: DOM Fallback if API returned 0 reviews
      if (reviews.length === 0) {
        console.log('⚠️ [ReviewCollector] API collection yielded 0 items. Falling back to DOM review scraping...');
        const domReviews = await page.evaluate(function (max) {
          const items: any[] = [];
          const reviewEls = document.querySelectorAll(
            '.review_item, li[class*="review_item"], div[class*="ReviewItem"], ul[class*="review"] > li'
          );

          for (let i = 0; i < reviewEls.length && items.length < max; i++) {
            const el = reviewEls[i] as HTMLElement;
            const textEl = el.querySelector('p, span[class*="content"], div[class*="text"], div[class*="body"]');
            const text = textEl ? textEl.textContent?.trim() || '' : el.textContent?.trim() || '';
            if (text.length < 5) continue;

            // Extract rating
            const ratingEl = el.querySelector('span[class*="score"], em[class*="star"], div[class*="rating"]');
            const ratingText = ratingEl ? ratingEl.textContent?.trim() || '5' : '5';
            const ratingMatch = ratingText.match(/([1-5])/);
            const rating = ratingMatch ? Number(ratingMatch[1]) : 5;

            items.push({
              reviewId: `dom_rev_${i + 1}`,
              reviewText: text,
              rating,
              createdAt: new Date().toISOString(),
              option: '',
              isVerifiedPurchase: true,
              helpfulCount: 0,
              hasImage: !!el.querySelector('img'),
            });
          }
          return items;
        }, maxReviews);

        reviews = domReviews;
        console.log(`✅ [ReviewCollector] Collected ${reviews.length} reviews via DOM fallback.`);
      }

      return reviews;
    } catch (err: any) {
      console.error('❌ [ReviewCollector] Error scraping reviews:', err.message);
      return [];
    } finally {
      await browser.close();
    }
  }
}
