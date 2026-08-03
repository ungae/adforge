import { ProductAnalyzerModule } from './modules/intelligence/product-analyzer.module';
import { ReviewIntelligenceModule } from './modules/intelligence/review-intelligence.module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * AdForge v2 Sprint 1 & 2: Real Product Analyzer & Review Intelligence Demo
 * Runs actual live scraping without mock data.
 */
async function bootstrap() {
  console.log('🚀 [AdForge v2 | Sprint 1 & 2] 실시간 상품 분석기 & Review Intelligence Engine 초기화 중...\n');

  // Allow URL input via CLI argument, fallback to default Osulloc product URL
  const targetUrl =
    process.argv[2] || 'https://brand.naver.com/osulloc/products/10120190602';
  const campaignSlug = 'sprint2_review_intelligence_demo';

  console.log('=' .repeat(80));
  console.log(`🕷️  [Target URL] ${targetUrl}`);
  console.log(`📁 [Campaign ID] ${campaignSlug}`);
  console.log('=' .repeat(80));

  const productAnalyzer = new ProductAnalyzerModule();
  const reviewIntelligence = new ReviewIntelligenceModule();
  const startTime = Date.now();

  try {
    // 1. Sprint 1: Product Analyzer
    console.log('\n--- [Sprint 1: Product Analyzer 실행] ---');
    const productResult = await productAnalyzer.analyzeUrl(targetUrl, {
      campaignId: campaignSlug,
    });
    console.log(`✅ 상품명: ${productResult.productName}`);
    console.log(`✅ 브랜드: ${productResult.brand}`);
    console.log(`✅ 가격  : ${productResult.price.current.toLocaleString()}원 (정가: ${productResult.price.original.toLocaleString()}원)`);

    // 2. Sprint 2: Review Intelligence Engine (Advertising Intelligence)
    console.log('\n--- [Sprint 2: Review Intelligence Engine 실행 (Advertising Intelligence)] ---');
    const reviewResult = await reviewIntelligence.analyzeReviews(targetUrl, {
      campaignId: campaignSlug,
      maxReviews: 30, // Default sample size for demo speed
    });

    const durationMs = Date.now() - startTime;

    console.log('\n' + '=' .repeat(80));
    console.log(`✨ Sprint 1 & 2 실시간 분석 및 Zod 검증 성공! (총 소요 시간: ${durationMs}ms)`);
    console.log('=' .repeat(80) + '\n');

    console.log('--- [Sprint 2: Advertising Intelligence 추출 보고서] ---');
    console.log(`1. 총 분석 리뷰 수     : ${reviewResult.statistics.totalReviewCount}개 (평균 길이: ${reviewResult.statistics.averageLength}자)`);
    console.log(`2. 긍정/중립/부정 비율 : 긍정 ${reviewResult.statistics.positiveRatio} / 중립 ${reviewResult.statistics.neutralRatio} / 부정 ${reviewResult.statistics.negativeRatio}`);
    console.log(`3. 주요 구매 동기 (TOP 3):`);
    reviewResult.purchaseReasons.slice(0, 3).forEach((r, idx) => console.log(`   [${idx + 1}] ${r}`));
    
    console.log(`4. 고객 생생 언어 (Customer Language | 고점수 광고 인용 후보):`);
    reviewResult.customerLanguage.slice(0, 3).forEach((item, idx) => {
      console.log(`   [${idx + 1}] "${item.quote}" (광고점수: ${item.adScore}점 / 감정: ${item.emotion})`);
    });

    console.log(`5. 주요 반론 (Objections) 예시:`);
    console.log(`   - 가격: ${reviewResult.objections.priceObjections[0] || '(없음)'}`);
    console.log(`   - 신뢰: ${reviewResult.objections.trustObjections[0] || '(없음)'}`);
    console.log(`   - 효과: ${reviewResult.objections.effectObjections[0] || '(없음)'}`);

    console.log(`6. 광고 인용 후보 리뷰 (adScore >= 80): 총 ${reviewResult.adCandidateReviews.length}건`);
    if (reviewResult.adCandidateReviews.length > 0) {
      console.log(`   👉 대표 인용구: "${reviewResult.adCandidateReviews[0].quote}" (점수: ${reviewResult.adCandidateReviews[0].adScore})`);
    }

    console.log(`7. 근거 추적 (Evidence Engine): 총 ${reviewResult.evidences.length}개 리뷰 출처 매핑 완료`);
    console.log();

    const savedProductPath = join(process.cwd(), 'data', campaignSlug, '01_product_analysis.json');
    const savedRawReviewsPath = join(process.cwd(), 'data', campaignSlug, '02_review_raw.json');
    const savedIntelPath = join(process.cwd(), 'data', campaignSlug, '03_review_intelligence.json');
    const savedCustomerLangPath = join(process.cwd(), 'data', campaignSlug, 'customer_language.json');

    console.log('--- [JSON 데이터 저장 결과 검증] ---');
    console.log(`💾 01_product_analysis.json  : ${existsSync(savedProductPath) ? '✅ 성공' : '❌ 실패'} (${savedProductPath})`);
    console.log(`💾 02_review_raw.json        : ${existsSync(savedRawReviewsPath) ? '✅ 성공' : '❌ 실패'} (${savedRawReviewsPath})`);
    console.log(`💾 03_review_intelligence.json: ${existsSync(savedIntelPath) ? '✅ 성공' : '❌ 실패'} (${savedIntelPath})`);
    console.log(`💾 customer_language.json    : ${existsSync(savedCustomerLangPath) ? '✅ 성공' : '❌ 실패'} (${savedCustomerLangPath})`);
    console.log('=' .repeat(80) + '\n');
  } catch (error) {
    console.error('\n❌ [Error] 분석 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

bootstrap();
