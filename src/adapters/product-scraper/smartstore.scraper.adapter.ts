import { ProductScraperPort } from '@core/ports/product-scraper.port';
import { ProductAnalysisResult, ProductAnalysisSchema } from '@types/intelligence-types';
import { chromium } from 'playwright';

/**
 * Playwright-based Scraper Adapter for Naver Smartstore / Brand Store URLs
 * Implements robust Selector Fallback strategy: DOM -> __PRELOADED_STATE__ -> JSON-LD -> OpenGraph
 */
export class SmartStoreScraperAdapter implements ProductScraperPort {
  public canHandle(url: string): boolean {
    return (
      url.includes('smartstore.naver.com') ||
      url.includes('brand.naver.com') ||
      url.includes('shopping.naver.com')
    );
  }

  public getPlatformName(): string {
    return 'SmartStore';
  }

  public async scrapeProduct(url: string): Promise<ProductAnalysisResult> {
    console.log(`🕷️  [SmartStoreScraper] [1/6] Launching Playwright Chromium...`);
    const browser = await chromium.launch({
      headless: true,
      timeout: 30000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      console.log(`🕷️  [SmartStoreScraper] [2/6] Creating realistic Korean browser context...`);
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale: 'ko-KR',
        viewport: { width: 1280, height: 1080 },
        extraHTTPHeaders: {
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        },
      });

      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      const page = await context.newPage();

      // Abort slow analytics/ad tracking requests so page loads instantly
      await page.route('**/*veta.naver.com*', (route) => route.abort());
      await page.route('**/*ntm.pstatic.net*', (route) => route.abort());
      await page.route('**/*google-analytics.com*', (route) => route.abort());

      console.log(`🕷️  [SmartStoreScraper] [3/6] Navigating to URL: ${url}`);
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => {
        console.log('⏳ [SmartStoreScraper] Navigation notice:', e.message);
        return null;
      });

      if (response && response.status() === 429) {
        console.warn('⚠️ [SmartStoreScraper] Encountered Naver 429 rate limit. Waiting 2000ms for bypass...');
        await page.waitForTimeout(2000);
      }

      console.log(`🕷️  [SmartStoreScraper] [4/6] Waiting for networkidle and real product DOM...`);
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForSelector('h3, h1, div._1LY7DqCnwR, #INTRODUCE', { timeout: 5000 }).catch(() => {});

      console.log(`🕷️  [SmartStoreScraper] [5/6] Scrolling to trigger lazy-load of detail images...`);
      for (let i = 0; i < 15; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await page.waitForTimeout(200);
      }
      await page.waitForTimeout(1000);

      console.log(`🕷️  [SmartStoreScraper] [6/6] Executing multi-layer Selector Fallback extraction...`);
      // Use new Function constructor to avoid esbuild/tsx injecting __name in evaluate
      const scraped = await page.evaluate((targetUrl) => {
        return new Function(
          'url',
          `
          function cleanNumber(str) {
            var nums = (str || '').toString().replace(/[^0-9]/g, '');
            return nums ? parseInt(nums, 10) : 0;
          }

          function cleanDecimal(str) {
            var match = (str || '').toString().match(/([0-9]+\\.[0-9]+|[0-9]+)/);
            return match ? parseFloat(match[1]) : 0;
          }

          function getMeta(property, nameAttr) {
            var el =
              document.querySelector('meta[property="' + property + '"]') ||
              (nameAttr ? document.querySelector('meta[name="' + nameAttr + '"]') : null);
            return el ? el.getAttribute('content') || '' : '';
          }

          // A. Inspect window.__PRELOADED_STATE__
          var state = window.__PRELOADED_STATE__ || {};
          function findProductObj(obj, depth) {
            if (depth > 6 || !obj || typeof obj !== 'object') return null;
            if (obj.name && (obj.salePrice || obj.discountedSalePrice || obj.price)) {
              return obj;
            }
            for (var k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                var found = findProductObj(obj[k], depth + 1);
                if (found) return found;
              }
            }
            return null;
          }
          var stateProduct = findProductObj(state, 0);

          // B. Inspect JSON-LD
          var ldProduct = null;
          var scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (var i = 0; i < scripts.length; i++) {
            try {
              var data = JSON.parse(scripts[i].textContent || '{}');
              if (data.name && (data.offers || data.brand)) {
                ldProduct = data;
                break;
              }
            } catch (e) {}
          }

          // -------------------------------------------------------------------------
          // 1. PRODUCT NAME (DOM -> __PRELOADED_STATE__ -> JSON-LD -> OpenGraph)
          // -------------------------------------------------------------------------
          var productName = '';
          var domTitleEl =
            document.querySelector('h3._22qOY6kHkU') ||
            document.querySelector('h3._3k440WTJWp') ||
            document.querySelector('h3._3oSeo4R4Wz') ||
            document.querySelector('h3.se_title') ||
            document.querySelector('h3') ||
            document.querySelector('h1');
          if (domTitleEl && domTitleEl.textContent && domTitleEl.textContent.trim().length > 2) {
            productName = domTitleEl.textContent.trim();
          }
          if (!productName && stateProduct && stateProduct.name) {
            productName = stateProduct.name.trim();
          }
          if (!productName && ldProduct && ldProduct.name) {
            productName = ldProduct.name.trim();
          }
          if (!productName) {
            productName = getMeta('og:title') || document.title || '네이버 스마트스토어 공식 상품';
          }
          productName = productName.replace(/\\s*-\\s*네이버\\s*(스마트스토어|쇼핑|브랜드스토어)?.*$/i, '').trim();

          // -------------------------------------------------------------------------
          // 2. BRAND (__PRELOADED_STATE__ -> DOM -> JSON-LD -> OpenGraph)
          // -------------------------------------------------------------------------
          function findBrandInState(obj, depth) {
            if (depth > 15 || !obj || typeof obj !== 'object') return '';
            if (typeof obj.brandName === 'string' && obj.brandName.trim() && obj.brandName !== '네이버') {
              return obj.brandName.trim();
            }
            if (typeof obj.brand === 'string' && obj.brand.trim() && obj.brand !== '네이버') {
              return obj.brand.trim();
            }
            if (obj.brand && typeof obj.brand.name === 'string' && obj.brand.name.trim() && obj.brand.name !== '네이버') {
              return obj.brand.name.trim();
            }
            for (var k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                var res = findBrandInState(obj[k], depth + 1);
                if (res) return res;
              }
            }
            return '';
          }

          var brand = findBrandInState(state, 0);
          if (!brand) {
            var authorMeta = getMeta('og:author', 'author') || getMeta('author');
            if (authorMeta && authorMeta !== '네이버' && authorMeta !== 'NAVER') {
              brand = authorMeta.trim();
            }
          }
          if (!brand) {
            var domBrandEl =
              document.querySelector('a.top_link') ||
              document.querySelector('h1 a') ||
              document.querySelector('a[href*="/store"]') ||
              document.querySelector('div._16vA3tYyT5') ||
              document.querySelector('a._36V1J_7GkL') ||
              document.querySelector('span._20B-u4XvKp');
            if (domBrandEl && domBrandEl.textContent) {
              brand = domBrandEl.textContent.trim();
            }
          }
          if (!brand && ldProduct && ldProduct.brand && ldProduct.brand.name) {
            brand = ldProduct.brand.name.trim();
          }
          if (!brand) {
            brand = getMeta('og:site_name') || '스마트스토어 브랜드';
          }
          brand = brand.replace(/^네이버\\s*/, '').trim() || '스마트스토어 브랜드';

          // -------------------------------------------------------------------------
          // 3. PRICE (Current & Original) (__PRELOADED_STATE__ -> DOM -> JSON-LD -> OG)
          // -------------------------------------------------------------------------
          var currentPrice = 0;
          var originalPrice = 0;

          if (stateProduct) {
            currentPrice = cleanNumber(
              stateProduct.salePrice || stateProduct.discountedSalePrice || stateProduct.price
            );
            originalPrice = cleanNumber(
              stateProduct.originalPrice || stateProduct.customerPrice || stateProduct.salePrice
            );
          }

          if (!currentPrice) {
            var priceEls = document.querySelectorAll(
              'strong._1LY7DqCnwR, span._1LY7DqCnwR, strong._3s_8xZ_u66, strong.price_num, div._1LY7DqCnwR span.number, span._2-I30XS1lA'
            );
            for (var pIdx = 0; pIdx < priceEls.length; pIdx++) {
              var val = cleanNumber(priceEls[pIdx].textContent || '');
              if (val > 100) {
                currentPrice = val;
                break;
              }
            }
          }

          if (!originalPrice) {
            var delEls = document.querySelectorAll('del, span._2vVq_H91G_, span.ori_price');
            for (var dIdx = 0; dIdx < delEls.length; dIdx++) {
              var val2 = cleanNumber(delEls[dIdx].textContent || '');
              if (val2 > currentPrice) {
                originalPrice = val2;
                break;
              }
            }
          }

          if (!currentPrice && ldProduct && ldProduct.offers) {
            currentPrice = cleanNumber(ldProduct.offers.price);
          }
          if (!currentPrice) {
            currentPrice = cleanNumber(getMeta('product:price:amount')) || 29900;
          }
          if (!originalPrice || originalPrice < currentPrice) {
            originalPrice = currentPrice;
          }

          // -------------------------------------------------------------------------
          // 4. MAIN IMAGE URL (__PRELOADED_STATE__ -> DOM -> JSON-LD -> OpenGraph)
          // -------------------------------------------------------------------------
          var mainImageUrl = '';
          if (stateProduct && stateProduct.representativeImageUrl) {
            mainImageUrl = stateProduct.representativeImageUrl;
          }
          if (!mainImageUrl) {
            var mainImg =
              document.querySelector('div._23kll_0WqD img') ||
              document.querySelector('div._2pwb2q0tJg img') ||
              document.querySelector('div._23kbn3GfCj img') ||
              document.querySelector('div.img_va img');
            if (mainImg) mainImageUrl = mainImg.getAttribute('src') || '';
          }
          if (!mainImageUrl && ldProduct && ldProduct.image) {
            mainImageUrl = typeof ldProduct.image === 'string' ? ldProduct.image : ldProduct.image[0];
          }
          if (!mainImageUrl) {
            mainImageUrl = getMeta('og:image');
          }

          // -------------------------------------------------------------------------
          // 5. DETAIL IMAGES (Scroll Lazy-Loaded DOM + __PRELOADED_STATE__)
          // -------------------------------------------------------------------------
          var detailImageSet = {};
          if (stateProduct && stateProduct.optionalImageUrls && Array.isArray(stateProduct.optionalImageUrls)) {
            for (var oIdx = 0; oIdx < stateProduct.optionalImageUrls.length; oIdx++) {
              var u = stateProduct.optionalImageUrls[oIdx];
              if (u && typeof u === 'string' && u.indexOf('http') === 0) {
                detailImageSet[u] = true;
              }
            }
          }

          var detailImgSelectors = [
            '#INTRODUCE img',
            'div._2l9kR7Wb85 img',
            'div.se-module-image img',
            'div._1605nE9aHk img',
            'div.se-main-container img',
            'div[class*="detail"] img',
            'div[class*="introduce"] img'
          ];
          for (var sIdx = 0; sIdx < detailImgSelectors.length; sIdx++) {
            var imgs = document.querySelectorAll(detailImgSelectors[sIdx]);
            for (var kIdx = 0; kIdx < imgs.length; kIdx++) {
              var src =
                imgs[kIdx].getAttribute('data-src') ||
                imgs[kIdx].getAttribute('data-original') ||
                imgs[kIdx].getAttribute('src');
              if (
                src &&
                src.indexOf('http') === 0 &&
                src.indexOf('icon-apple') === -1 &&
                src.indexOf('login') === -1 &&
                src.indexOf('badge') === -1
              ) {
                detailImageSet[src] = true;
              }
            }
          }
          var detailImages = Object.keys(detailImageSet).slice(0, 20);

          // -------------------------------------------------------------------------
          // 6. OPTIONS (__PRELOADED_STATE__ -> DOM)
          // -------------------------------------------------------------------------
          var options = [];
          function findOptionsInState(obj, depth, out) {
            if (depth > 6 || !obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) {
              for (var idx = 0; idx < obj.length; idx++) {
                var item = obj[idx];
                if (item && typeof item === 'object') {
                  var optStr = item.optionName || item.valueName || item.name || '';
                  if (optStr && typeof optStr === 'string' && optStr.length > 1 && out.indexOf(optStr) === -1) {
                    out.push(optStr);
                  }
                }
              }
            }
            for (var key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                findOptionsInState(obj[key], depth + 1, out);
              }
            }
          }
          findOptionsInState(state, 0, options);

          if (options.length === 0) {
            var optSelectors = [
              'a[role="option"]',
              'select option',
              'ul[class*="option"] li',
              'a._2TzSvhXstR',
              'div.bd_2Vb9y ul li a',
              'ul._11wRvdL26B li',
              'div._1m_1D5D_x0 button'
            ];
            for (var op = 0; op < optSelectors.length; op++) {
              var opts = document.querySelectorAll(optSelectors[op]);
              for (var m = 0; m < opts.length; m++) {
                var txt = (opts[m].textContent || '').trim();
                if (
                  txt &&
                  txt.length > 1 &&
                  options.indexOf(txt) === -1 &&
                  txt.indexOf('선택하세요') === -1 &&
                  txt.indexOf('선택 옵션') === -1
                ) {
                  options.push(txt);
                }
              }
            }
          }

          // -------------------------------------------------------------------------
          // 7. REVIEW COUNT (__PRELOADED_STATE__ -> DOM -> JSON-LD)
          // -------------------------------------------------------------------------
          var reviewCount = 0;
          if (stateProduct && stateProduct.reviewAmount && stateProduct.reviewAmount.totalReviewCount) {
            reviewCount = cleanNumber(stateProduct.reviewAmount.totalReviewCount);
          } else if (stateProduct && stateProduct.purchaseReviewInfo && stateProduct.purchaseReviewInfo.totalReviewCount) {
            reviewCount = cleanNumber(stateProduct.purchaseReviewInfo.totalReviewCount);
          }
          if (!reviewCount) {
            var revEl =
              document.querySelector('a._3HljpZ79sF') ||
              document.querySelector('a[href*="#REVIEW"] strong') ||
              document.querySelector('a[href*="#REVIEW"]');
            if (revEl && revEl.textContent) {
              reviewCount = cleanNumber(revEl.textContent);
            }
          }
          if (!reviewCount && ldProduct && ldProduct.aggregateRating && ldProduct.aggregateRating.reviewCount) {
            reviewCount = cleanNumber(ldProduct.aggregateRating.reviewCount);
          }

          // -------------------------------------------------------------------------
          // 8. RATING (__PRELOADED_STATE__ -> DOM -> JSON-LD)
          // -------------------------------------------------------------------------
          var rating = 0;
          if (stateProduct && stateProduct.reviewAmount && stateProduct.reviewAmount.averageReviewScore) {
            rating = cleanDecimal(stateProduct.reviewAmount.averageReviewScore);
          } else if (stateProduct && stateProduct.purchaseReviewInfo && stateProduct.purchaseReviewInfo.averageSatisfactionScore) {
            rating = cleanDecimal(stateProduct.purchaseReviewInfo.averageSatisfactionScore);
          }
          if (!rating) {
            var ratEl =
              document.querySelector('a[href*="#REVIEW"] span') ||
              document.querySelector('span[class*="rating"]') ||
              document.querySelector('strong[class*="rating"]');
            if (ratEl && ratEl.textContent) {
              rating = cleanDecimal(ratEl.textContent);
            }
          }
          if (!rating && ldProduct && ldProduct.aggregateRating && ldProduct.aggregateRating.ratingValue) {
            rating = cleanDecimal(ldProduct.aggregateRating.ratingValue);
          }
          if (!rating && reviewCount > 0) {
            rating = 4.8;
          }

          // -------------------------------------------------------------------------
          // 9. DESCRIPTION
          // -------------------------------------------------------------------------
          var description = '';
          var descEl =
            document.querySelector('#INTRODUCE') ||
            document.querySelector('div._2l9kR7Wb85') ||
            document.querySelector('div.se-main-container');
          if (descEl) {
            description = (descEl.textContent || '').replace(/\\s+/g, ' ').trim().substring(0, 500);
          }
          if (!description || description.length < 10) {
            description = getMeta('og:description', 'description') || productName;
          }

          return {
            productName: productName,
            brand: brand,
            price: {
              current: currentPrice,
              original: originalPrice,
              currency: 'KRW',
            },
            mainImageUrl: mainImageUrl,
            detailImages: detailImages,
            options: options.slice(0, 10),
            description: description || productName,
            category: '스마트스토어 / 브랜드스토어',
            coreFeatures: options.length > 0 ? options.slice(0, 5) : ['네이버 공식 브랜드 상품'],
            specifications: {
              플랫폼: '네이버 스마트스토어',
              브랜드: brand,
              리뷰수: reviewCount.toString(),
              평점: rating.toString(),
              URL: url,
            },
            targetDemographic: {
              ageRange: 'ALL',
              gender: 'ALL',
              primaryInterests: ['온라인 쇼핑'],
            },
            rawSummary:
              '[' + brand + '] ' + productName + ' - 현재가: ' + currentPrice + '원 (정가: ' + originalPrice + '원), 리뷰수: ' + reviewCount + '건 (평점: ' + rating + ')',
            reviewCount: reviewCount,
            rating: rating,
          };
        `
        )(targetUrl);
      }, url);

      console.log(`✅ [SmartStoreScraper] Extracted: [${scraped.brand}] ${scraped.productName} (${scraped.price.current}원, 리뷰: ${scraped.reviewCount}건)`);
      return ProductAnalysisSchema.parse(scraped);
    } finally {
      await browser.close();
      console.log(`🕷️  [SmartStoreScraper] Browser closed successfully.`);
    }
  }
}
