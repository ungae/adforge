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
  purchaseReasons: z.array(z.string()),
  customerLanguage: z.array(CustomerLanguageItemSchema),
  painPoints: z.array(z.string()),
  praisePoints: z.array(z.string()),
  objections: ReviewObjectionsSchema,
  emotionalTriggers: z.array(z.string()),
  unexpectedBenefits: z.array(z.string()),
  usageScenarios: z.array(z.string()),
  beforeAfter: z.array(z.string()),
  hookCandidates: z.array(z.string()),
  adCandidateReviews: z.array(ReviewCandidateSchema),
  faqCandidates: z.array(z.string()),
  personaDistribution: z.array(PersonaDistributionSchema).default([]),
  statistics: ReviewStatisticsSchema,
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
// 3. Competitor Finder Schema & Types
// ---------------------------------------------------------------------------
export const CompetitorAnalysisSchema = z.object({
  competitors: z.array(
    z.object({
      brandName: z.string(),
      productName: z.string(),
      productUrl: z.string(),
      estimatedPrice: z.number(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      differentiationPoint: z.string(),
    })
  ),
  marketPositioningSummary: z.string(),
});

export type CompetitorAnalysisResult = z.infer<typeof CompetitorAnalysisSchema>;

// ---------------------------------------------------------------------------
// 4. Meta Ad Analyzer Schema & Types
// ---------------------------------------------------------------------------
export const MetaAdAnalysisSchema = z.object({
  analyzedAdCount: z.number(),
  winningHooks: z.array(
    z.object({
      hookText: z.string(),
      hookType: z.enum(['QUESTION', 'SHOCKING_FACT', 'BENEFIT', 'PAIN_POINT']),
      estimatedEngagement: z.enum(['HIGH', 'MEDIUM']),
    })
  ),
  dominantVisualStyles: z.array(z.string()),
  ctaPatterns: z.array(z.string()),
});

export type MetaAdAnalysisResult = z.infer<typeof MetaAdAnalysisSchema>;

// ---------------------------------------------------------------------------
// 5. Knowledge Base Loader (Obsidian KB) Schema & Types
// ---------------------------------------------------------------------------
export const KnowledgeBaseSchema = z.object({
  loadedDocuments: z.array(
    z.object({
      filePath: z.string(),
      title: z.string(),
      tags: z.array(z.string()),
      keyInsights: z.array(z.string()),
      applicableFrameworks: z.array(z.string()),
    })
  ),
  brandGuidelineOverride: z.object({
    toneAndManner: z.string(),
    forbiddenWords: z.array(z.string()),
    preferredHookStyles: z.array(z.string()),
  }),
});

export type KnowledgeBaseResult = z.infer<typeof KnowledgeBaseSchema>;

// ---------------------------------------------------------------------------
// 6. Evidence Engine Schema & Types
// ---------------------------------------------------------------------------
export const EvidenceSourceSchema = z.object({
  sourceType: z.enum(['REVIEW', 'COMPETITOR', 'META_AD', 'OBSIDIAN_KB', 'PRODUCT_SPEC']),
  referenceId: z.string(),
  snippet: z.string(),
  rationale: z.string(),
});

export const UspEvidenceSchema = z.object({
  uspId: z.string(),
  uspText: z.string(),
  confidenceScore: z.number().min(0).max(100),
  evidenceSources: z.array(EvidenceSourceSchema),
});

export const EvidenceStoreSchema = z.object({
  campaignId: z.string(),
  uspEvidences: z.array(UspEvidenceSchema),
});

export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;
export type UspEvidence = z.infer<typeof UspEvidenceSchema>;
export type EvidenceStoreResult = z.infer<typeof EvidenceStoreSchema>;

// ---------------------------------------------------------------------------
// 7. USP Generator Schema & Types
// ---------------------------------------------------------------------------
export const WinningAngleSchema = z.object({
  angleId: z.string(),
  angleName: z.string(),
  targetPersona: z.string(),
  hookStatement: z.string(),
  problemStatement: z.string(),
  solutionStatement: z.string(),
  socialProofAnchor: z.string(),
});

export const UspGenerationSchema = z.object({
  primaryUsp: z.string(),
  secondaryUsps: z.array(z.string()),
  winningAngles: z.array(WinningAngleSchema),
  differentiationMatrix: z.object({
    vsCompetitors: z.array(z.string()),
  }),
});

export type WinningAngle = z.infer<typeof WinningAngleSchema>;
export type UspGenerationResult = z.infer<typeof UspGenerationSchema>;

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
