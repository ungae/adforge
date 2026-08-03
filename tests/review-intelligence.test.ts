import { describe, expect, test } from 'bun:test';
import { ReviewIntelligenceModule } from '../src/modules/intelligence/review-intelligence.module';
import { ReviewCleanerService } from '../src/modules/intelligence/review-cleaner.service';
import { ReviewScraperPort } from '../src/adapters/review-scraper/review-scraper.port';
import { ReviewItem, ReviewIntelligenceSchema } from '../src/types/intelligence-types';

class MockReviewScraper implements ReviewScraperPort {
  async scrapeReviews(url: string, maxReviews = 300): Promise<ReviewItem[]> {
    return [
      {
        reviewId: '101',
        reviewText:
          '퇴근하면 허리가 끊어질 것 같았어요. 어떤 선물을 할까 고민하다가 샀는데 너무 만족합니다. 예전에는 다른 제품 썼는데 이걸로 바꾸니 훨씬 좋아요.',
        rating: 5,
        createdAt: '2026-07-20T10:00:00Z',
        option: '기본 세트',
        isVerifiedPurchase: true,
        helpfulCount: 5,
        hasImage: true,
      },
      {
        reviewId: '102',
        reviewText:
          '이 가격에 이 정도 퀄리티면 정말 훌륭합니다. 솔직히 저렴해서 큰 기대 안 했는데 생각보다 너무 좋아서 놀랐어요. 배송 박스 파손만 조금 아쉬웠습니다.',
        rating: 4,
        createdAt: '2026-07-21T11:00:00Z',
        option: '고급 세트',
        isVerifiedPurchase: true,
        helpfulCount: 2,
        hasImage: false,
      },
      {
        reviewId: '103',
        reviewText: '좋아요', // meaningless short review -> should be scored low / cleaned
        rating: 5,
        createdAt: '2026-07-22T12:00:00Z',
        option: '',
        isVerifiedPurchase: true,
        helpfulCount: 0,
        hasImage: false,
      },
    ];
  }
}

describe('Sprint 2: Review Intelligence Engine Integration Tests', () => {
  const module = new ReviewIntelligenceModule(new MockReviewScraper(), new ReviewCleanerService());

  test('should analyze reviews and generate complete Advertising Intelligence compliant with Zod Schema', async () => {
    const result = await module.analyzeReviews('https://brand.naver.com/test/12345');

    // Schema Validation
    expect(() => ReviewIntelligenceSchema.parse(result)).not.toThrow();

    // Prompt Version check
    expect(result.promptVersion).toBe('v1.0');

    // Customer Language structured quotes
    expect(result.customerLanguage.length).toBeGreaterThan(0);
    expect(result.customerLanguage[0]).toHaveProperty('quote');
    expect(result.customerLanguage[0]).toHaveProperty('normalized');
    expect(result.customerLanguage[0]).toHaveProperty('emotion');
    expect(result.customerLanguage[0]).toHaveProperty('adScore');
    expect(result.customerLanguage[0]).toHaveProperty('persona');
    expect(result.customerLanguage[0]).toHaveProperty('scene');

    // Objections breakdown
    expect(result.objections).toHaveProperty('priceObjections');
    expect(result.objections).toHaveProperty('trustObjections');
    expect(result.objections).toHaveProperty('effectObjections');
    expect(result.objections).toHaveProperty('comparisonObjections');

    // Ad Candidate Reviews (adScore >= 80)
    expect(result.adCandidateReviews.length).toBeGreaterThan(0);
    expect(
      result.adCandidateReviews.every((r) => r.adScore >= 80 || (r.adPotentialScore && r.adPotentialScore >= 80))
    ).toBe(true);

    // Evidence linking
    expect(result.evidences.length).toBeGreaterThan(0);
    expect(result.evidences[0].source).toBe('REVIEW');
    expect(result.evidences[0].reviewId).toBeDefined();

    // Statistics
    expect(result.statistics.totalReviewCount).toBe(3);
    expect(result.statistics.positiveRatio).toBeGreaterThan(0);
    expect(result.statistics.topKeywords.length).toBeGreaterThan(0);
  });
});
