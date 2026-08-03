import { ProductAnalysisResult } from '@types/intelligence-types';

/**
 * Vendor-Agnostic Port for E-Commerce Product Scrapers
 * Future adapters can support Coupang, Amazon, Shopify/Custom Malls, etc.
 */
export interface ProductScraperPort {
  /**
   * Returns true if this adapter can handle the given e-commerce product URL
   */
  canHandle(url: string): boolean;

  /**
   * Scrapes product details from the actual URL and returns Zod-validatable ProductAnalysisResult
   */
  scrapeProduct(url: string): Promise<ProductAnalysisResult>;

  /**
   * Identifier name of the platform (e.g. "SmartStore", "Coupang", "Amazon")
   */
  getPlatformName(): string;
}
