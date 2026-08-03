import { describe, expect, test } from 'bun:test';
import { ReviewCleanerService } from '../src/modules/intelligence/review-cleaner.service';
import { ReviewItem } from '../src/types/intelligence-types';

describe('Sprint 2: Review Cleaner Service Unit Tests', () => {
  const cleaner = new ReviewCleanerService();

  test('should strip Emojis and HTML tags', () => {
    const input = '<div>이 제품 정말 좋아요! 😊❤️ 🚀</div>';
    const cleanedText = cleaner.stripEmojis(cleaner.stripHtml(input));
    expect(cleanedText).toBe('이 제품 정말 좋아요!');
  });

  test('should deduplicate reviews by normalized content', () => {
    const reviews: ReviewItem[] = [
      {
        reviewId: '1',
        reviewText: '어떤 선물을 할까 고민하다가 구입했어요',
        rating: 5,
        createdAt: '2026-07-20',
        option: '',
        isVerifiedPurchase: true,
        helpfulCount: 0,
        hasImage: false,
      },
      {
        reviewId: '2',
        reviewText: '어떤 선물을 할까   고민하다가 구입했어요',
        rating: 5,
        createdAt: '2026-07-21',
        option: '',
        isVerifiedPurchase: true,
        helpfulCount: 0,
        hasImage: false,
      },
    ];

    const deduplicated = cleaner.deduplicateReviews(reviews);
    expect(deduplicated.length).toBe(1);
    expect(deduplicated[0].reviewId).toBe('1');
  });

  test('should penalize meaningless short reviews like "좋아요", "굿"', () => {
    const reviews: ReviewItem[] = [
      {
        reviewId: '1',
        reviewText: '좋아요',
        rating: 5,
        createdAt: '2026-07-20',
        option: '',
        isVerifiedPurchase: true,
        helpfulCount: 0,
        hasImage: false,
      },
      {
        reviewId: '2',
        reviewText: '굿',
        rating: 5,
        createdAt: '2026-07-20',
        option: '',
        isVerifiedPurchase: true,
        helpfulCount: 0,
        hasImage: false,
      },
    ];

    const scored = cleaner.cleanAndScoreReviews(reviews);
    expect(scored.length).toBe(2);
    expect(scored[0].qualityScore).toBe(20);
    expect(scored[0].importanceScore).toBe(10);
    expect(scored[0].reason).toContain('단순 긍정/의미 없는 단답형 리뷰');
  });

  test('should assign high importanceScore and detailed reason for rich customer reviews', () => {
    const reviews: ReviewItem[] = [
      {
        reviewId: '100',
        reviewText:
          '어떤 선물을 할까 고민하다가 오설록 차들을 맛있게 마신 경험이 있어서 선물 세트로 결정하였습니다. 예전에는 다른 차를 마셨는데 오설록으로 바꾸니 향이 달라서 만족합니다.',
        rating: 5,
        createdAt: '2026-07-20',
        option: '',
        isVerifiedPurchase: true,
        helpfulCount: 3,
        hasImage: true,
      },
    ];

    const scored = cleaner.cleanAndScoreReviews(reviews);
    expect(scored[0].importanceScore).toBeGreaterThanOrEqual(90);
    expect(scored[0].reason).toContain('구체적인 사용 경험');
    expect(scored[0].reason).toContain('감정 표현');
    expect(scored[0].reason).toContain('Before/After 존재');
    expect(scored[0].reason).toContain('구매 이유 포함');
  });
});
