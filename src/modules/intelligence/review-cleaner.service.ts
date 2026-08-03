import { CleanedReviewItem, ReviewItem } from '../../types/intelligence-types';

export class ReviewCleanerService {
  private readonly meaninglessPatterns = [
    /^좋아요.?$/i,
    /^굿.?$/i,
    /^good.?$/i,
    /^추천.?$/i,
    /^추천합니다.?$/i,
    /^잘.?받았습니다.?$/i,
    /^배송.?빠르네요.?$/i,
    /^배송.?빠르고.?좋아요.?$/i,
    /^좋습니다.?$/i,
    /^최고.?$/i,
    /^최고예요.?$/i,
    /^잘.?쓰고.?있습니다.?$/i,
    /^만족합니다.?$/i,
  ];

  /**
   * Strip Emojis from text
   */
  stripEmojis(text: string): string {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
      .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
      .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/\p{Emoji_Presentation}/gu, '')
      .trim();
  }

  /**
   * Strip HTML tags
   */
  stripHtml(text: string): string {
    return text.replace(/<[^>]*>?/gm, '').trim();
  }

  /**
   * Deduplicate review items by normalized text content
   */
  deduplicateReviews(reviews: ReviewItem[]): ReviewItem[] {
    const seen = new Set<string>();
    const result: ReviewItem[] = [];

    for (const rev of reviews) {
      const normalizedText = rev.reviewText.replace(/\s+/g, '').toLowerCase();
      if (!seen.has(normalizedText) && normalizedText.length > 0) {
        seen.add(normalizedText);
        result.push(rev);
      }
    }

    return result;
  }

  /**
   * Filter, preprocess, and calculate qualityScore & importanceScore for reviews
   */
  cleanAndScoreReviews(reviews: ReviewItem[]): CleanedReviewItem[] {
    const deduplicated = this.deduplicateReviews(reviews);
    const cleaned: CleanedReviewItem[] = [];

    for (const rev of deduplicated) {
      let text = this.stripHtml(rev.reviewText);
      text = this.stripEmojis(text);

      if (text.length === 0) continue;

      let qualityScore = 80;
      let importanceScore = 50;
      const reason: string[] = [];

      // Check if it's a meaningless short review
      const isMeaningless =
        text.length < 8 ||
        this.meaninglessPatterns.some((p) => p.test(text.trim()));

      if (isMeaningless) {
        qualityScore = 20;
        importanceScore = 10;
        reason.push('단순 긍정/의미 없는 단답형 리뷰');
      } else {
        // Reason 1: 구체적인 사용 경험 (Length >= 45 or specific experience words)
        if (text.length >= 45 || /사용해|써보|마셔보|먹어보|경험|시간|일주일|한달/.test(text)) {
          reason.push('구체적인 사용 경험');
          importanceScore += 15;
          qualityScore += 10;
        }

        // Reason 2: 감정 표현
        if (/좋아|감동|놀랐|만족|행복|아프|힘들|불편|걱정|고민|추천/.test(text)) {
          reason.push('감정 표현');
          importanceScore += 12;
        }

        // Reason 3: Before/After 존재
        if (/전에는|예전|바뀌|달라|개선|효과|해결|줄었|좋아졌/.test(text)) {
          reason.push('Before/After 존재');
          importanceScore += 18;
          qualityScore += 10;
        }

        // Reason 4: 구매 이유 포함
        if (/때문에|보고|위해|선물|찾다가|고민하다|결정|주문/.test(text)) {
          reason.push('구매 이유 포함');
          importanceScore += 15;
        }
      }

      importanceScore = Math.min(100, Math.max(0, importanceScore));
      qualityScore = Math.min(100, Math.max(0, qualityScore));

      cleaned.push({
        ...rev,
        reviewText: text,
        qualityScore,
        importanceScore,
        reason,
      });
    }

    return cleaned;
  }
}
