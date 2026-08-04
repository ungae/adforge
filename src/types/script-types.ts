import { z } from 'zod';

/**
 * Stage 11: Creative Strategy Layer Schema (11_creative_strategy.json)
 * Enforces 1 primary strategy with confidence (0-100) + alternativeStrategies
 */
export const CreativeStrategyItemSchema = z.object({
  strategyId: z.string(),
  strategyName: z.string(),
  persona: z.string(),
  winningAngle: z.string(),
  emotion: z.string(),
  hookType: z.enum([
    'QUESTION',
    'SHOCKING_FACT',
    'EMPATHY',
    'CONTRADICTION',
    'NUMBER',
    'COMPARISON',
    'STORY',
  ]),
  tone: z.string(),
  ctaStyle: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(100),
  primaryEvidenceIds: z.array(z.string()).min(1),
});

export type CreativeStrategyItem = z.infer<typeof CreativeStrategyItemSchema>;

export const CreativeStrategyResultSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default('1.0'),
    generatedAt: z.string(),
    campaignId: z.string(),
  }),
  campaignId: z.string(),
  primaryStrategy: CreativeStrategyItemSchema,
  alternativeStrategies: z.array(CreativeStrategyItemSchema),
});

export type CreativeStrategyResult = z.infer<typeof CreativeStrategyResultSchema>;

/**
 * Stage 12: Hook Candidates & Persistent Hook Library Schema (12_hook_candidates.json)
 */
export const HookCandidateItemSchema = z.object({
  hookId: z.string(),
  hookType: z.enum([
    'QUESTION',
    'SHOCKING_FACT',
    'EMPATHY',
    'CONTRADICTION',
    'NUMBER',
    'COMPARISON',
    'STORY',
  ]),
  hookText: z.string().min(3),
  targetPersona: z.string(),
  targetAngle: z.string(),
  predictedCtr: z.number().min(0).max(100),
  usedCount: z.number().nonnegative().default(1),
  successRate: z.number().min(0).max(100).default(75),
  industry: z.string().default('General'),
  reusableAssetTag: z.string(),
});

export type HookCandidateItem = z.infer<typeof HookCandidateItemSchema>;

export const HookCandidatesResultSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default('1.0'),
    generatedAt: z.string(),
    campaignId: z.string(),
  }),
  campaignId: z.string(),
  totalCandidates: z.number().int().min(1),
  topHooks: z.array(HookCandidateItemSchema),
  allHooks: z.array(HookCandidateItemSchema),
});

export type HookCandidatesResult = z.infer<typeof HookCandidatesResultSchema>;

/**
 * Persistent Global Hook Library Repository Schema
 */
export const GlobalHookLibrarySchema = z.object({
  meta: z.object({
    lastUpdatedAt: z.string(),
    totalStoredHooks: z.number().int().nonnegative(),
  }),
  hooks: z.array(HookCandidateItemSchema),
});

export type GlobalHookLibrary = z.infer<typeof GlobalHookLibrarySchema>;

/**
 * Stage 13: 7-Part Script Structure Plan Schema (13_script_plan.json)
 */
export const ScriptPlanSectionSchema = z.object({
  step: z.enum(['HOOK', 'PROBLEM', 'EMPATHY', 'INSIGHT', 'USP', 'PROOF', 'CTA']),
  title: z.string(),
  description: z.string(),
  coreMessage: z.string(),
  evidenceIds: z.array(z.string()).min(1),
});

export type ScriptPlanSection = z.infer<typeof ScriptPlanSectionSchema>;

export const ScriptPlanResultSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default('1.0'),
    generatedAt: z.string(),
    campaignId: z.string(),
  }),
  campaignId: z.string(),
  strategyId: z.string(),
  planSections: z.array(ScriptPlanSectionSchema).length(7),
});

export type ScriptPlanResult = z.infer<typeof ScriptPlanResultSchema>;

/**
 * Stage 14: Creative Composer Output Schema (14_ad_scripts.json)
 * Version A~E with Creative Reason & Evidence Lock + Strength (HIGH/MEDIUM/LOW)
 */
export const EvidenceCitationSchema = z.object({
  evidenceId: z.string(),
  sourceType: z.enum(['REVIEW', 'PRODUCT_SPEC', 'KNOWLEDGE_BASE', 'COMPETITOR', 'META_AD']),
  evidenceStrength: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  quoteOrClaim: z.string(),
});

export type EvidenceCitation = z.infer<typeof EvidenceCitationSchema>;

export const CreativeReasonSchema = z.object({
  selectedPersona: z.string(),
  selectedAngle: z.string(),
  selectedHook: z.string(),
  selectionRationale: z.string(),
  primaryEvidenceId: z.string(),
});

export type CreativeReason = z.infer<typeof CreativeReasonSchema>;

export const ScriptLineSchema = z.object({
  lineNumber: z.number().int().positive(),
  sectionRole: z.enum(['HOOK', 'PROBLEM', 'EMPATHY', 'INSIGHT', 'USP', 'PROOF', 'CTA']),
  spokenText: z.string(),
  onScreenText: z.string(),
  evidenceCitations: z.array(EvidenceCitationSchema).min(1),
});

export type ScriptLine = z.infer<typeof ScriptLineSchema>;

export const ComposedScriptVersionSchema = z.object({
  versionId: z.string(), // e.g. "Version A"
  versionName: z.string(),
  persona: z.string(),
  winningAngle: z.string(),
  creativeReasoning: CreativeReasonSchema,
  totalDurationSeconds: z.number().int().min(15).max(60).default(30),
  scriptLines: z.array(ScriptLineSchema).min(3),
});

export type ComposedScriptVersion = z.infer<typeof ComposedScriptVersionSchema>;

export const CreativeComposerResultSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default('1.0'),
    generatedAt: z.string(),
    campaignId: z.string(),
  }),
  campaignId: z.string(),
  composerMode: z.literal('ASSEMBLY_FROM_ASSETS'),
  scriptVersions: z.array(ComposedScriptVersionSchema).min(5),
});

export type CreativeComposerResult = z.infer<typeof CreativeComposerResultSchema>;

/**
 * Stage 15: 10-Dimension Detailed Storyboard Schema (15_storyboards.json)
 * Includes assetType for Sprint 5 automated branching
 */
export const StoryboardAssetTypeSchema = z.enum([
  'UGC',
  'PRODUCT_SHOT',
  'REVIEW_SCREEN',
  'LIFESTYLE',
  'CTA_BANNER',
  'BEFORE_AFTER',
  'UNBOXING',
]);

export type StoryboardAssetType = z.infer<typeof StoryboardAssetTypeSchema>;

export const StoryboardScene10DSchema = z.object({
  sceneNumber: z.number().int().positive(),
  role: z.enum(['HOOK', 'PROBLEM', 'EMPATHY', 'INSIGHT', 'USP', 'PROOF', 'CTA']),
  assetType: StoryboardAssetTypeSchema,
  durationSeconds: z.number().min(1),
  visualDescription: z.string(),
  aiVideoPrompt: z.string(),
  onScreenSubtitle: z.string(),
  voiceoverText: z.string(),
  cameraMotion: z.string(),
  soundAndBgm: z.string(),
  bRollInsert: z.string(),
  propAndSetting: z.string(),
  facialExpressionAndEmotion: z.string(),
});

export type StoryboardScene10D = z.infer<typeof StoryboardScene10DSchema>;

export const StoryboardVersionSchema = z.object({
  versionId: z.string(),
  versionName: z.string(),
  totalDurationSeconds: z.number(),
  scenes: z.array(StoryboardScene10DSchema).min(3),
});

export type StoryboardVersion = z.infer<typeof StoryboardVersionSchema>;

export const StoryboardsResultSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default('1.0'),
    generatedAt: z.string(),
    campaignId: z.string(),
  }),
  campaignId: z.string(),
  storyboards: z.array(StoryboardVersionSchema).min(5),
});

export type StoryboardsResult = z.infer<typeof StoryboardsResultSchema>;

/**
 * Stage 16: Hybrid Quality Scorer Schema (16_script_scores.json)
 * Rule Score (40) + AI Score (60) + Ad Readability Score (0-100) + Creative Diversity Score (0-100)
 */
export const ScriptRuleScoreSchema = z.object({
  hasFirst3SecHook: z.boolean(), // 10 pts
  hasClearUsp: z.boolean(), // 10 pts
  hasActionableCta: z.boolean(), // 10 pts
  hasEvidenceLock: z.boolean(), // 10 pts
  ruleScoreTotal: z.number().min(0).max(40),
});

export type ScriptRuleScore = z.infer<typeof ScriptRuleScoreSchema>;

export const ScriptAiScoreSchema = z.object({
  hookCtrPower: z.number().min(0).max(15), // 15 pts
  empathyResonance: z.number().min(0).max(15), // 15 pts
  persuasiveFlow: z.number().min(0).max(15), // 15 pts
  conversationalNaturalness: z.number().min(0).max(15), // 15 pts
  aiScoreTotal: z.number().min(0).max(60),
});

export type ScriptAiScore = z.infer<typeof ScriptAiScoreSchema>;

export const ScriptVersionScoreSchema = z.object({
  versionId: z.string(),
  versionName: z.string(),
  ruleScore: ScriptRuleScoreSchema,
  aiScore: ScriptAiScoreSchema,
  adReadabilityScore: z.number().min(0).max(100), // Short conversational subtitle-ready text
  totalScore: z.number().min(0).max(100), // Rule + AI
  rationale: z.string(),
});

export type ScriptVersionScore = z.infer<typeof ScriptVersionScoreSchema>;

export const ScriptScoresResultSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default('1.0'),
    generatedAt: z.string(),
    campaignId: z.string(),
  }),
  campaignId: z.string(),
  creativeDiversityScore: z.number().min(0).max(100), // Evaluates differentiation across Versions A~E
  diversityRationale: z.string(),
  versionScores: z.array(ScriptVersionScoreSchema).min(5),
  averageTotalScore: z.number().min(0).max(100),
  auditStatus: z.enum(['PASSED', 'NEEDS_REVISION', 'FAILED']),
});

export type ScriptScoresResult = z.infer<typeof ScriptScoresResultSchema>;
