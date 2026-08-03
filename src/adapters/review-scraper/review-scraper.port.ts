import { ReviewItem } from '../../types/intelligence-types';

export interface ReviewScraperPort {
  /**
   * Scrape real customer reviews for a given URL (up to maxReviews, default 300).
   */
  scrapeReviews(url: string, maxReviews?: number): Promise<ReviewItem[]>;
}
