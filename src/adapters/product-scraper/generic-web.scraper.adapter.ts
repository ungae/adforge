import { ProductScraperPort } from '@core/ports/product-scraper.port';
import { ProductAnalysisResult, ProductAnalysisSchema } from '@types/intelligence-types';
import { chromium } from 'playwright';

/**
 * Generic Web E-Commerce Scraper fallback using OpenGraph and meta tags
 */
export class GenericWebScraperAdapter implements ProductScraperPort {
  public canHandle(url: string): boolean {
    return true; // Fallback handler for any web URL
  }

  public getPlatformName(): string {
    return 'GenericWeb';
  }

  public async scrapeProduct(url: string): Promise<ProductAnalysisResult> {
    console.log(`🕷️  [GenericWebScraper] Launching Playwright to analyze URL: ${url}`);

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'ko-KR',
    });

    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1500);

      const scraped = await page.evaluate((targetUrl) => {
        return new Function(
          'url',
          `
          function getMeta(property, nameAttr) {
            var el =
              document.querySelector('meta[property="' + property + '"]') ||
              (nameAttr ? document.querySelector('meta[name="' + nameAttr + '"]') : null);
            return el ? el.getAttribute('content') || '' : '';
          }

          function cleanNumber(str) {
            var nums = (str || '').replace(/[^0-9]/g, '');
            return nums ? parseInt(nums, 10) : 0;
          }

          var productName = getMeta('og:title') || document.title || '웹 상품';
          var brand = getMeta('og:site_name') || '웹스토어';
          var currentPrice = cleanNumber(getMeta('product:price:amount'));
          if (!currentPrice) currentPrice = 10000;
          var originalPrice = currentPrice;
          var mainImageUrl = getMeta('og:image');
          var description = getMeta('og:description', 'description') || productName;

          var detailImages = [];
          var imgEls = document.querySelectorAll('main img, article img, div.content img');
          for (var i = 0; i < imgEls.length; i++) {
            var src = imgEls[i].src;
            if (src && src.indexOf('http') === 0 && detailImages.indexOf(src) === -1) {
              detailImages.push(src);
            }
          }

          return {
            productName: productName.trim(),
            brand: brand.trim(),
            price: {
              current: currentPrice,
              original: originalPrice,
              currency: 'KRW',
            },
            mainImageUrl: mainImageUrl,
            detailImages: detailImages.slice(0, 10),
            options: ['기본 옵션'],
            description: description.substring(0, 500),
            category: '기타/웹스토어',
            coreFeatures: ['웹 공식 판매 상품'],
            specifications: { URL: url },
            targetDemographic: {
              ageRange: 'ALL',
              gender: 'ALL',
              primaryInterests: ['온라인 쇼핑'],
            },
            rawSummary: '[' + brand + '] ' + productName,
          };
        `
        )(targetUrl);
      }, url);

      return ProductAnalysisSchema.parse(scraped);
    } finally {
      await browser.close();
    }
  }
}
