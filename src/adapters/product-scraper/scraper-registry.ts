import { ProductScraperPort } from '@core/ports/product-scraper.port';
import { GenericWebScraperAdapter } from './generic-web.scraper.adapter';
import { SmartStoreScraperAdapter } from './smartstore.scraper.adapter';

/**
 * Registry for Product Scraper Adapters.
 * Selects the appropriate platform scraper (Smartstore, Coupang, Amazon, Generic) based on URL.
 */
export class ScraperRegistry {
  private scrapers: ProductScraperPort[] = [];

  constructor() {
    this.register(new SmartStoreScraperAdapter());
    // Fallback handler last
    this.register(new GenericWebScraperAdapter());
  }

  public register(scraper: ProductScraperPort): void {
    this.scrapers.push(scraper);
  }

  public getScraper(url: string): ProductScraperPort {
    for (const scraper of this.scrapers) {
      if (scraper.canHandle(url)) {
        return scraper;
      }
    }
    // Should always be caught by GenericWebScraperAdapter
    return this.scrapers[this.scrapers.length - 1];
  }
}

export const scraperRegistry = new ScraperRegistry();
