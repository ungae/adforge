import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. Product Analyzer Schema & Types
// ---------------------------------------------------------------------------
export const ProductAnalysisSchema = z.object({
  productName: z.string(),
  brand: z.string().default('브랜드 정보 없음'),
  price: z.object({
    current: z.number(),
    original: z.number(),
    currency: z.string().default('KRW'),
  }),
  mainImageUrl: z.string().optional(),
  detailImages: z.array(z.string()).default([]),
  options: z.array(z.string()).default([]),
  description: z.string().default(''),
  category: z.string().default('기타/미분류'),
  coreFeatures: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.string()).default({}),
  targetDemographic: z
    .object({
      ageRange: z.string(),
      gender: z.enum(['ALL', 'FEMALE', 'MALE']),
      primaryInterests: z.array(z.string()),
    })
    .default({ ageRange: 'ALL', gender: 'ALL', primaryInterests: [] }),
  rawSummary: z.string().default(''),
  reviewCount: z.number().default(0),
  rating: z.number().default(0),
});

export type ProductAnalysisResult = z.infer<typeof ProductAnalysisSchema>;

// ---------------------------------------------------------------------------
// 2. Review Intelligence Schema & Types (Sprint 2: Advertising Intelligence)
// ---------------------------------------------------------------------------
export const ReviewItemSchema = z.object({
  reviewId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  reviewText: z.string(),
  rating: z.number().min(1).max(5),
  createdAt: z.string(),
  option: z.string().default(''),
  isVerifiedPurchase: z.boolean().default(true),
  helpfulCount: z.number().default(0),
  hasImage: z.boolean().default(false),
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export const CleanedReviewItemSchema = ReviewItemSchema.extend({
  qualityScore: z.number().min(0).max(100),
  importanceScore: z.number().min(0).max(100),
  reason: z.array(z.string()),
});
export type CleanedReviewItem = z.infer<typeof CleanedReviewItemSchema>;

export const CustomerLanguageItemSchema = z.object({
  quote: z.string(),
  normalized: z.string(),
  emotion: z.string(),
  frequency: z.number(),
  adScore: z.number().min(0).max(100),
  persona: z.array(z.string()),
  scene: z.array(z.string()),
});
export type CustomerLanguageItem = z.infer<typeof CustomerLanguageItemSchema>;

export const ReviewObjectionsSchema = z.object({
  priceObjections: z.array(z.string()).default([]),
  trustObjections: z.array(z.string()).default([]),
  effectObjections: z.array(z.string()).default([]),
  comparisonObjections: z.array(z.string()).default([]),
});
export type ReviewObjections = z.infer<typeof ReviewObjectionsSchema>;

export const ReviewCandidateSchema = z.object({
  reviewId: z.string().default(''),
  quote: z.string(),
  author: z.string().optional(),
  rating: z.number().min(1).max(5),
  adScore: z.number().min(0).max(100),
  adPotentialScore: z.number().min(0).max(100).optional(),
});
export type ReviewCandidate = z.infer<typeof ReviewCandidateSchema>;

export const ReviewEvidenceItemSchema = z.object({
  reviewId: z.string(),
  source: z.literal('REVIEW').default('REVIEW'),
  quote: z.string(),
  weight: z.number().min(0).max(1).default(0.93),
});
export type ReviewEvidenceItem = z.infer<typeof ReviewEvidenceItemSchema>;

export const ReviewStatisticsSchema = z.object({
  totalReviewCount: z.number(),
  averageLength: z.number(),
  positiveRatio: z.number(),
  neutralRatio: z.number(),
  negativeRatio: z.number(),
  topKeywords: z.array(
    z.object({
      keyword: z.string(),
      count: z.number(),
    })
  ),
});
export type ReviewStatistics = z.infer<typeof ReviewStatisticsSchema>;

export const PersonaDistributionSchema = z.object({
  persona: z.string(),
  count: z.number(),
});
export type PersonaDistribution = z.infer<typeof PersonaDistributionSchema>;

export const ReviewIntelligenceSchema = z.object({
  promptVersion: z.string().default('v1.0'),
  purchaseReasons: z.array(z.string()).default([]),
  customerLanguage: z.array(z.any()).default([]),
  painPoints: z.array(z.any()).default([]),
  praisePoints: z.array(z.any()).default([]),
  objections: ReviewObjectionsSchema.optional(),
  emotionalTriggers: z.array(z.string()).default([]),
  unexpectedBenefits: z.array(z.string()).default([]),
  usageScenarios: z.array(z.string()).default([]),
  beforeAfter: z.array(z.string()).default([]),
  hookCandidates: z.array(z.string()).default([]),
  adCandidateReviews: z.array(z.any()).default([]),
  faqCandidates: z.array(z.string()).default([]),
  personaDistribution: z.array(PersonaDistributionSchema).default([]),
  statistics: ReviewStatisticsSchema.optional(),
  evidences: z.array(ReviewEvidenceItemSchema).default([]),
  // Backward compatibility fields for v1 pipeline tests:
  overallRating: z.number().default(4.8),
  reviewCount: z.number().default(0),
  sentimentRatio: z
    .object({
      positive: z.number(),
      neutral: z.number(),
      negative: z.number(),
    })
    .default({ positive: 0.85, neutral: 0.1, negative: 0.05 }),
  unmetNeeds: z.array(z.string()).default([]),
});

export type ReviewIntelligenceResult = z.infer<typeof ReviewIntelligenceSchema>;

// ---------------------------------------------------------------------------
// Common JSON Meta Header (Sprint 3 Requirement 8)
// ---------------------------------------------------------------------------
export const JsonMetaHeaderSchema = z.object({
  schemaVersion: z.string().default('1.0'),
  pipelineVersion: z.string().default('Sprint3'),
  generatedAt: z.string(),
  generatorVersion: z.string().default('AdForge v2'),
  campaignId: z.string(),
  sourceUrl: z.string().optional(),
});

export type JsonMetaHeader = z.infer<typeof JsonMetaHeaderSchema>;

// Helper for wrapping output with standard { meta, data } format
export const createEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    meta: JsonMetaHeaderSchema,
    data: dataSchema,
  });

// ---------------------------------------------------------------------------
// 3. Competitor Finder Schema & Types (Sprint 3 - Requirement 3 & 4-Stage)
// ---------------------------------------------------------------------------
export const CompetitorItemSchema = z.object({
  brand: z.string(),
  productName: z.string(),
  price: z.number(),
  rating: z.number(),
  reviewCount: z.number(),
  coreUSP: z.string(),
  detailPageClaims: z.array(z.string()),
  reviewKeywords: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  differentiationPoint: z.string(), // opportunities / differentiation vs our brand
  mainImageUrl: z.string().optional(),
  hasMetaAd: z.boolean().optional(),
  metaAdDurationDays: z.number().optional(),
  naverSearchVolume: z.string().optional(),
  evidenceIds: z.array(z.string()).default([]),
  // v1 backwards compatibility
  brandName: z.string().optional(),
  productUrl: z.string().optional(),
  estimatedPrice: z.number().optional(),
});

export const CompetitorAnalysisSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  competitors: z.array(CompetitorItemSchema),
  marketPositioningSummary: z.string(),
});

export type CompetitorItem = z.infer<typeof CompetitorItemSchema>;
export type CompetitorAnalysisResult = z.infer<typeof CompetitorAnalysisSchema>;

// ---------------------------------------------------------------------------
// 4. Meta Ad Analyzer Schema & Types (Sprint 3 - Requirement 2: 7-part Ad Structure)
// ---------------------------------------------------------------------------
export const MetaAdStructureSchema = z.object({
  Hook: z.string(),
  Problem: z.string(),
  Empathy: z.string(),
  USP: z.string(),
  UsageScene: z.string(),
  SocialProof: z.string(),
  CTA: z.string(),
});

export const MetaAdItemSchema = z.object({
  adId: z.string(),
  structure: MetaAdStructureSchema,
  hookType: z.enum(['QUESTION', 'SHOCKING_FACT', 'BENEFIT', 'PAIN_POINT', 'CONTRADICTION', 'STORY']),
  hookText: z.string(),
  ctaType: z.string(),
  ctaText: z.string(),
  sceneCount: z.number(),
  videoLength: z.number(),
  first3Seconds: z.string(),
  subtitleStyle: z.string(),
  visualStyle: z.string(),
  isUGC: z.boolean(),
  isBeforeAfter: z.boolean(),
  evidenceIds: z.array(z.string()).default([]),
});

export const MetaAdAnalysisSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  analyzedAdCount: z.number(),
  ads: z.array(MetaAdItemSchema).default([]),
  dominantVisualStyles: z.array(z.string()),
  ctaPatterns: z.array(z.string()),
  // v1 backwards compatibility
  winningHooks: z
    .array(
      z.object({
        hookText: z.string(),
        hookType: z.enum(['QUESTION', 'SHOCKING_FACT', 'BENEFIT', 'PAIN_POINT', 'CONTRADICTION', 'STORY']),
        estimatedEngagement: z.enum(['HIGH', 'MEDIUM']),
      })
    )
    .optional(),
});

export type MetaAdStructure = z.infer<typeof MetaAdStructureSchema>;
export type MetaAdItem = z.infer<typeof MetaAdItemSchema>;
export type MetaAdAnalysisResult = z.infer<typeof MetaAdAnalysisSchema>;

// ---------------------------------------------------------------------------
// 5. Knowledge Base Loader Schema & Types (Sprint 3 - Requirement 7: KB First)
// ---------------------------------------------------------------------------
export const KnowledgeBaseDocumentSchema = z.object({
  filePath: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  content: z.string().default(''),
  keyInsights: z.array(z.string()),
  applicableFrameworks: z.array(z.string()),
});

export const KnowledgeBaseSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  loadedDocuments: z.array(KnowledgeBaseDocumentSchema),
  brandGuidelineOverride: z.object({
    toneAndManner: z.string(),
    forbiddenWords: z.array(z.string()),
    preferredHookStyles: z.array(z.string()),
    videoGuidelines: z.array(z.string()).default([]),
  }),
});

export type KnowledgeBaseDocument = z.infer<typeof KnowledgeBaseDocumentSchema>;
export type KnowledgeBaseResult = z.infer<typeof KnowledgeBaseSchema>;

// ---------------------------------------------------------------------------
// 6. Persona Engine Schema & Types (Sprint 3 - Requirement 4: Min 5 Personas + Evidence)
// ---------------------------------------------------------------------------
export const PersonaItemSchema = z.object({
  personaId: z.string(),
  personaName: z.string(), // e.g. "사무직 직장인", "육아맘", "운동인", "선물용 구매자", "4050세대"
  pain: z.string(),
  goal: z.string(),
  fear: z.string(),
  trigger: z.string(),
  preferredHook: z.string(),
  purchaseReason: z.string(),
  evidenceIds: z.array(z.string()).min(1),
});

export const PersonaEngineSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  personas: z.array(PersonaItemSchema).min(1), // will enforce >= 5 in validation/tests
});

export type PersonaItem = z.infer<typeof PersonaItemSchema>;
export type PersonaEngineResult = z.infer<typeof PersonaEngineSchema>;

// ---------------------------------------------------------------------------
// 7. Winning Angle Engine Schema & Types (Sprint 3 - Requirement 5: Min 3 Angles/Persona)
// ---------------------------------------------------------------------------
export const WinningAngleItemSchema = z.object({
  angleId: z.string(),
  persona: z.string().optional(), // target persona name
  pain: z.string().optional(),
  hook: z.string().optional(),
  angle: z.string().optional(),
  emotion: z.string().optional(),
  evidenceIds: z.array(z.string()).optional(),
  // v1 backwards compatibility
  angleName: z.string().optional(),
  targetPersona: z.string().optional(),
  hookStatement: z.string().optional(),
  problemStatement: z.string().optional(),
  solutionStatement: z.string().optional(),
  socialProofAnchor: z.string().optional(),
});

export const WinningAngleEngineSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  winningAngles: z.array(WinningAngleItemSchema).min(1), // >= 3 angles per persona
});

export type WinningAngleItem = z.infer<typeof WinningAngleItemSchema>;
export type WinningAngleEngineResult = z.infer<typeof WinningAngleEngineSchema>;

// ---------------------------------------------------------------------------
// 8. USP Generator Schema & Types (Sprint 3 - Requirement 6: 7 Extended USP Types)
// ---------------------------------------------------------------------------
export const UspTypeEnum = z.enum([
  'PRIMARY',
  'FUNCTIONAL',
  'EMOTIONAL',
  'SOCIAL_PROOF',
  'PRICE',
  'COMPETITOR',
  'OFFER',
]);

export const UspItemSchema = z.object({
  uspType: UspTypeEnum,
  uspName: z.string(), // e.g. "Primary USP", "Functional USP", etc.
  uspText: z.string(), // advertising copy message, not technical spec
  reasonWhy: z.string(),
  supportingEvidence: z.string(),
  competitorGap: z.string(),
  reviewQuote: z.string(),
  evidenceIds: z.array(z.string()).min(1),
});

export const UspGenerationSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  usps: z.array(UspItemSchema).min(7), // all 7 required types
  primaryUsp: z.string(),
  secondaryUsps: z.array(z.string()),
  winningAngles: z.array(WinningAngleItemSchema).default([]), // backwards compatibility
  differentiationMatrix: z
    .object({
      vsCompetitors: z.array(z.string()),
    })
    .optional(),
});

export type UspType = z.infer<typeof UspTypeEnum>;
export type UspItem = z.infer<typeof UspItemSchema>;
export type UspGenerationResult = z.infer<typeof UspGenerationSchema>;

// ---------------------------------------------------------------------------
// 9. Evidence Engine Schema & Types (Sprint 3 - Requirement 3 & Full Provable Index)
// ---------------------------------------------------------------------------
export const EvidenceItemSchema = z.object({
  evidenceId: z.string().optional(),
  evidenceType: z.enum(['REVIEW', 'COMPETITOR', 'META_AD', 'PRODUCT_SPEC', 'KNOWLEDGE_BASE']).optional(),
  sourceId: z.string().optional(),
  quote: z.string().optional(),
  rationale: z.string().optional(),
  source: z.string().optional(),
  excerpt: z.string().optional(),
  referencedBy: z.array(z.string()).optional(),
  // v1 backwards compatibility
  sourceType: z.enum(['REVIEW', 'COMPETITOR', 'META_AD', 'OBSIDIAN_KB', 'PRODUCT_SPEC']).optional(),
  referenceId: z.string().optional(),
  snippet: z.string().optional(),
});

export const EvidenceStoreSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  reason: z.string().optional(),
  campaignId: z.string().optional(),
  evidences: z.array(EvidenceItemSchema).optional(),
  connectionRate: z.number().min(0).max(100).default(100),
  // v1 backwards compatibility
  uspEvidences: z
    .array(
      z.object({
        uspId: z.string(),
        uspText: z.string(),
        confidenceScore: z.number().min(0).max(100),
        evidenceSources: z.array(EvidenceItemSchema),
      })
    )
    .optional(),
});

export const EvidenceEngineSchema = z.object({
  status: z.enum(['SUCCESS', 'NOT_FOUND']).default('SUCCESS'),
  totalEvidences: z.number(),
  verifiedLinkageCount: z.number(),
  unlinkedCount: z.number(),
  evidenceMap: z.record(EvidenceItemSchema),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type EvidenceStoreResult = z.infer<typeof EvidenceStoreSchema>;
export type EvidenceEngineResult = z.infer<typeof EvidenceEngineSchema>;

// ---------------------------------------------------------------------------
// 10. Sprint 4 Script Generation Interface (THE SOURCE OF TRUTH)
// ---------------------------------------------------------------------------
export const ScriptGenerationInputSchema = z.object({
  meta: JsonMetaHeaderSchema,
  campaignId: z.string(),
  sourceUrl: z.string(),
  productAnalysis: z.any(), // 01_product_analysis
  reviewIntelligence: z.any(), // 03_review_intelligence
  competitorAnalysis: CompetitorAnalysisSchema, // 04_competitor_analysis
  metaAdAnalysis: MetaAdAnalysisSchema, // 05_meta_ad_analysis
  knowledgeBase: KnowledgeBaseSchema, // 05_knowledge_base
  personas: PersonaEngineSchema, // 06_personas
  winningAngles: WinningAngleEngineSchema, // 07_winning_angles
  uspGeneration: UspGenerationSchema, // 08_usp_generation
  evidenceStore: EvidenceStoreSchema, // 09_evidence
});

export type ScriptGenerationInput = z.infer<typeof ScriptGenerationInputSchema>;

// ---------------------------------------------------------------------------
// 8. Ad Script Generator Schema & Types
// ---------------------------------------------------------------------------
export const ScriptSceneSchema = z.object({
  sceneNumber: z.number(),
  durationSeconds: z.number(),
  role: z.enum(['HOOK', 'PROBLEM', 'SOLUTION', 'PROOF', 'CTA']),
  visualPrompt: z.string(), // Prompt for VideoGeneratorPort
  voiceoverText: z.string(), // Prompt for VoiceGeneratorPort
  onScreenCaption: z.string(),
});

export const AdScriptSchema = z.object({
  scriptId: z.string(),
  angleId: z.string(),
  title: z.string(),
  totalDurationSeconds: z.number(),
  scenes: z.array(ScriptSceneSchema),
});

export type ScriptScene = z.infer<typeof ScriptSceneSchema>;
export type AdScriptResult = z.infer<typeof AdScriptSchema>;

// ---------------------------------------------------------------------------
// 9. Timeline Specification Schema & Types (Multitrack JSON)
// ---------------------------------------------------------------------------
export const VideoTrackItemSchema = z.object({
  id: z.string(),
  sceneNumber: z.number(),
  videoUrl: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const AudioTrackItemSchema = z.object({
  id: z.string(),
  sceneNumber: z.number(),
  audioUrl: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  volume: z.number().default(1.0),
});

export const SubtitleTrackItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
});

export const TimelineSpecificationSchema = z.object({
  timelineId: z.string(),
  scriptId: z.string(),
  durationMs: z.number(),
  videoTrack: z.array(VideoTrackItemSchema),
  voiceTrack: z.array(AudioTrackItemSchema),
  bgmTrack: z.object({
    audioUrl: z.string(),
    volume: z.number(),
  }),
  subtitleTrack: z.array(SubtitleTrackItemSchema),
});

export type VideoTrackItem = z.infer<typeof VideoTrackItemSchema>;
export type AudioTrackItem = z.infer<typeof AudioTrackItemSchema>;
export type SubtitleTrackItem = z.infer<typeof SubtitleTrackItemSchema>;
export type TimelineSpecification = z.infer<typeof TimelineSpecificationSchema>;

// ---------------------------------------------------------------------------
// 10. CapCut Project Export Schema & Types
// ---------------------------------------------------------------------------
export const CapCutProjectExportSchema = z.object({
  exportId: z.string(),
  timelineId: z.string(),
  projectPath: z.string(),
  draftInfoJsonPath: z.string(),
  draftContentJsonPath: z.string(),
  draftInfoJson: z.string(),
  draftContentJson: z.string(),
});

export type CapCutProjectExport = z.infer<typeof CapCutProjectExportSchema>;
