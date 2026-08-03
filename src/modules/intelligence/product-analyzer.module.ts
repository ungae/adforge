import { scraperRegistry } from '@adapters/product-scraper/scraper-registry';
import { jsonStorage } from '@core/storage/json-storage.service';
import { ProductAnalysisResult, ProductAnalysisSchema } from '@types/intelligence-types';
import { withRetry } from '@utils/retry';

/**
 * Product Analyzer Module: Extracts specs, pricing, and features from a Product URL using real Playwright Scrapers
 */
export class ProductAnalyzerModule {
  /**
   * Analyzes a product URL using platform-specific scrapers without mock data.
   * Saves result automatically to data/<campaignId>/01_product_analysis.json
   */
  public async analyzeUrl(
    productUrl: string,
    options?: { campaignId?: string; overrideBrand?: string }
  ): Promise<ProductAnalysisResult> {
    const campaignId = options?.campaignId || `camp_${Date.now()}`;
    const scraper = scraperRegistry.getScraper(productUrl);

    console.log(`🔍 [ProductAnalyzer] Selecting Scraper: [${scraper.getPlatformName()}] for URL: ${productUrl}`);

    // Scrape with retry and automatic error logging to data/logs/error.log
    const rawResult = await withRetry(
      async () => {
        return await scraper.scrapeProduct(productUrl);
      },
      {
        maxRetries: 3,
        initialDelayMs: 1500,
        name: `ProductScraper-${scraper.getPlatformName()}`,
      }
    );

    if (options?.overrideBrand) {
      rawResult.brand = options.overrideBrand;
    }

    // Strict Zod runtime validation
    const validatedResult = ProductAnalysisSchema.parse(rawResult);

    // Save to data/<campaign>/01_product_analysis.json
    await jsonStorage.saveStepResult(campaignId, '01_product_analysis.json', validatedResult);

    return validatedResult;
  }
}
