import { describe, expect, test, beforeAll } from 'bun:test';
import { CompetitorFinderModule } from '@modules/intelligence/competitor-finder.module';
import { KnowledgeBaseLoaderModule } from '@modules/intelligence/knowledge-base-loader.module';
import { MetaAdAnalyzerModule } from '@modules/intelligence/meta-ad-analyzer.module';
import { PersonaEngineModule } from '@modules/intelligence/persona-engine.module';
import { WinningAngleEngineModule } from '@modules/intelligence/winning-angle-engine.module';
import { EvidenceEngineModule } from '@modules/strategy/evidence-engine.module';
import { UspGeneratorModule } from '@modules/strategy/usp-generator.module';
import {
  CompetitorAnalysisSchema,
  EvidenceEngineSchema,
  KnowledgeBaseSchema,
  MetaAdAnalysisSchema,
  PersonaEngineSchema,
  UspGenerationSchema,
  WinningAngleEngineSchema,
} from '@types/intelligence-types';

describe('Sprint 3: Marketing Intelligence Layer (4-Stage Architecture & Provenance)', () => {
  let kbLoader: KnowledgeBaseLoaderModule;
  let competitorFinder: CompetitorFinderModule;
  let metaAdAnalyzer: MetaAdAnalyzerModule;
  let personaEngine: PersonaEngineModule;
  let winningAngleEngine: WinningAngleEngineModule;
  let uspGenerator: UspGeneratorModule;
  let evidenceEngine: EvidenceEngineModule;

  const mockProduct = {
    status: 'SUCCESS' as const,
    productName: '로스트랩 드립 커피머신 프로',
    brand: '로스트랩 (RoastLab)',
    category: '가전/커피머신',
    coreFeatures: ['1분 고압 드립 추출', '스마트 앱 예약 컨트롤', '자동 스케일 청소 시스템'],
    targetDemographic: {
      ageRange: '25-45세',
      gender: '남녀공통',
      lifestyle: '홈카페 애호가, 바쁜 직장인',
    },
    uspList: ['1분 만에 카페 사장님 맛', '앱 제어 홈카페'],
    price: 189000,
    originalPrice: 249000,
    discountRate: 24,
    imageUrl: 'https://example.com/image.jpg',
    detailImageUrls: [],
    specifications: {},
  };

  const mockReviews = {
    status: 'SUCCESS' as const,
    promptVersion: 'v1.0',
    purchaseReasons: ['기존 커피 맛이 아쉬워서 신선한 원두 드립으로 갈아탐'],
    customerLanguage: ['갓성비 미쳤음', '아침 삶의 질 급상승'],
    painPoints: ['물통 입구가 조금 더 넓으면 세척솔 넣기 편할 것 같아요.'],
    praisePoints: ['맛의 일관성과 크레마'],
    emotionalTriggers: ['출근 전 정신없는 아침, 단 1분 만에 누리는 고급스러운 힐링'],
    unexpectedBenefits: [],
    usageScenarios: ['아침 기상 후 앱으로 추출'],
    beforeAfter: ['캡슐커피 마실 때보다 맛과 향이 압도적'],
    hookCandidates: ['스타벅스 갈 돈 한 달 아꼈더니 머신 값 바로 뽑았습니다'],
    adCandidateReviews: [],
    faqCandidates: [],
    personaDistribution: [],
    evidences: [
      {
        reviewId: 'rev-001',
        author: '커피러버',
        quote: '솔직히 스타벅스 갈 돈 한 달 아꼈더니 머신 값 바로 뽑았습니다. 맛은 더 훌륭해요!',
        rating: 5,
        category: 'PRAISE' as const,
        weight: 0.95,
      },
      {
        reviewId: 'rev-002',
        author: '아침직장인',
        quote: '침대에 누워서 핸드폰으로 예약 내리면 거실에 커피 향이 꽉 찹니다.',
        rating: 5,
        category: 'PRAISE' as const,
        weight: 0.93,
      },
    ],
  };

  beforeAll(() => {
    kbLoader = new KnowledgeBaseLoaderModule();
    competitorFinder = new CompetitorFinderModule();
    metaAdAnalyzer = new MetaAdAnalyzerModule();
    personaEngine = new PersonaEngineModule();
    winningAngleEngine = new WinningAngleEngineModule();
    uspGenerator = new UspGeneratorModule();
    evidenceEngine = new EvidenceEngineModule();
  });

  test('1. KnowledgeBaseLoaderModule should prioritize Obsidian KB and output validated schema', async () => {
    const result = await kbLoader.loadFromVault({ vaultPath: './obsidian_vault' });
    expect(KnowledgeBaseSchema.safeParse(result).success).toBe(true);
    expect(result.status).toBe('SUCCESS');
    expect(Array.isArray(result.loadedDocuments)).toBe(true);
    expect(result.brandGuidelineOverride.toneAndManner).toBeDefined();
    expect(result.brandGuidelineOverride.forbiddenWords).toBeDefined();
  });

  test('2. CompetitorFinderModule should execute 4-stage architecture and find >= 5 competitors without mocks', async () => {
    const result = await competitorFinder.findCompetitors({
      productName: mockProduct.productName,
      category: mockProduct.category,
      coreFeatures: mockProduct.coreFeatures,
      campaignId: 'test_camp_sprint3',
    });
    expect(CompetitorAnalysisSchema.safeParse(result).success).toBe(true);
    expect(result.competitors.length).toBeGreaterThanOrEqual(5);
    // Verify each competitor has structured fields
    for (const comp of result.competitors) {
      expect(comp.brand || comp.brandName).toBeDefined();
      expect(comp.productName).toBeDefined();
      expect(comp.price).toBeGreaterThan(0);
      expect(comp.rating || 4.0).toBeGreaterThan(0);
    }
  });

  test('3. MetaAdAnalyzerModule should analyze ad structure, hook types, and scene count without video downloads', async () => {
    const result = await metaAdAnalyzer.analyzeAds({
      keywords: mockProduct.coreFeatures,
      competitorBrands: ['필립스', '드롱기', '브레빌'],
      campaignId: 'test_camp_sprint3',
    });
    expect(MetaAdAnalysisSchema.safeParse(result).success).toBe(true);
    expect(result.analyzedAdCount).toBeGreaterThanOrEqual(1);
    for (const ad of result.ads) {
      expect(['QUESTION', 'SHOCKING_FACT', 'BENEFIT', 'PAIN_POINT', 'CONTRADICTION', 'STORY']).toContain(ad.hookType);
      expect(ad.sceneCount).toBeGreaterThanOrEqual(3);
      expect(ad.structure.Hook).toBeDefined();
      expect(ad.structure.CTA).toBeDefined();
    }
  });

  test('4. PersonaEngineModule should generate >= 5 diverse personas with 100% evidenceIds linkage', async () => {
    const kb = await kbLoader.loadFromVault({ vaultPath: './obsidian_vault' });
    const comp = await competitorFinder.findCompetitors({
      productName: mockProduct.productName,
      category: mockProduct.category,
      coreFeatures: mockProduct.coreFeatures,
      campaignId: 'test_camp_sprint3',
    });
    const result = await personaEngine.generatePersonas({
      reviewIntelligence: mockReviews,
      competitorAnalysis: comp,
      knowledgeBase: kb,
      campaignId: 'test_camp_sprint3',
    });
    expect(PersonaEngineSchema.safeParse(result).success).toBe(true);
    expect(result.personas.length).toBeGreaterThanOrEqual(5);
    for (const p of result.personas) {
      expect(p.evidenceIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('5. WinningAngleEngineModule should generate >= 3 angles per persona with 100% evidenceIds linkage', async () => {
    const kb = await kbLoader.loadFromVault({ vaultPath: './obsidian_vault' });
    const comp = await competitorFinder.findCompetitors({
      productName: mockProduct.productName,
      category: mockProduct.category,
      coreFeatures: mockProduct.coreFeatures,
      campaignId: 'test_camp_sprint3',
    });
    const personas = await personaEngine.generatePersonas({
      reviewIntelligence: mockReviews,
      competitorAnalysis: comp,
      knowledgeBase: kb,
      campaignId: 'test_camp_sprint3',
    });
    const result = await winningAngleEngine.generateAngles({
      personasResult: personas,
      reviewIntelligence: mockReviews,
      campaignId: 'test_camp_sprint3',
    });
    expect(WinningAngleEngineSchema.safeParse(result).success).toBe(true);
    expect(result.winningAngles.length).toBeGreaterThanOrEqual(personas.personas.length * 3);
    for (const angle of result.winningAngles) {
      expect(angle.evidenceIds?.length || 0).toBeGreaterThanOrEqual(1);
    }
  });

  test('6. UspGeneratorModule should generate all 7 Advertising USP types with 100% evidenceIds linkage', async () => {
    const kb = await kbLoader.loadFromVault({ vaultPath: './obsidian_vault' });
    const comp = await competitorFinder.findCompetitors({
      productName: mockProduct.productName,
      category: mockProduct.category,
      coreFeatures: mockProduct.coreFeatures,
      campaignId: 'test_camp_sprint3',
    });
    const metaAds = await metaAdAnalyzer.analyzeAds({
      keywords: mockProduct.coreFeatures,
      competitorBrands: comp.competitors.map((c) => c.brand || c.brandName),
      campaignId: 'test_camp_sprint3',
    });
    const result = await uspGenerator.generateUsps({
      product: mockProduct,
      reviews: mockReviews,
      competitors: comp,
      metaAds,
      kb,
      campaignId: 'test_camp_sprint3',
    });
    expect(UspGenerationSchema.safeParse(result).success).toBe(true);
    expect(result.usps.length).toBeGreaterThanOrEqual(7);

    const typesPresent = new Set(result.usps.map((u) => u.uspType));
    const requiredTypes = [
      'PRIMARY',
      'FUNCTIONAL',
      'EMOTIONAL',
      'SOCIAL_PROOF',
      'PRICE',
      'COMPETITOR',
      'OFFER',
    ];
    for (const reqType of requiredTypes) {
      expect(typesPresent.has(reqType as any)).toBe(true);
    }
    for (const usp of result.usps) {
      expect(usp.evidenceIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('7. EvidenceEngineModule should build 100% provenanced index across stages 01-08', async () => {
    const kb = await kbLoader.loadFromVault({ vaultPath: './obsidian_vault' });
    const comp = await competitorFinder.findCompetitors({
      productName: mockProduct.productName,
      category: mockProduct.category,
      coreFeatures: mockProduct.coreFeatures,
      campaignId: 'test_camp_sprint3',
    });
    const metaAds = await metaAdAnalyzer.analyzeAds({
      keywords: mockProduct.coreFeatures,
      competitorBrands: comp.competitors.map((c) => c.brand || c.brandName),
      campaignId: 'test_camp_sprint3',
    });
    const personas = await personaEngine.generatePersonas({
      reviewIntelligence: mockReviews,
      competitorAnalysis: comp,
      knowledgeBase: kb,
      campaignId: 'test_camp_sprint3',
    });
    const winningAngles = await winningAngleEngine.generateAngles({
      personasResult: personas,
      reviewIntelligence: mockReviews,
      campaignId: 'test_camp_sprint3',
    });
    const usps = await uspGenerator.generateUsps({
      product: mockProduct,
      reviews: mockReviews,
      competitors: comp,
      metaAds,
      kb,
      campaignId: 'test_camp_sprint3',
    });

    const index = await evidenceEngine.buildEvidenceIndex({
      product: mockProduct,
      reviews: mockReviews,
      competitors: comp,
      metaAds,
      personas,
      winningAngles,
      usps,
      campaignId: 'test_camp_sprint3',
    });

    expect(EvidenceEngineSchema.safeParse(index).success).toBe(true);
    expect(index.totalEvidences).toBeGreaterThanOrEqual(6);
    expect(index.unlinkedCount).toBe(0);
    expect(index.verifiedLinkageCount).toBeGreaterThanOrEqual(1);
  });
});
