import { ScriptGenerationInput } from '@types/intelligence-types';
import {
  CreativeComposerResult,
  StoryboardsResult,
  StoryboardsResultSchema,
  StoryboardVersion,
  StoryboardScene10D,
  StoryboardAssetType,
} from '@types/script-types';

/**
 * 4-Stage Architecture for Storyboard Builder Module (Stage 15)
 * 1. Collector: Collect composed script versions A~E
 * 2. Normalizer: Map script lines to visual scenes and timing durations
 * 3. Analyzer: Assign assetType (UGC, PRODUCT_SHOT, REVIEW_SCREEN, etc.) for Sprint 5 branching
 *    and build 10-Dimension scene specifications (AI prompt, camera motion, sound/BGM, emotion)
 * 4. Generator: Return Zod-validated 15_storyboards.json schema
 */
class StoryboardCollector {
  public collect(composer: CreativeComposerResult, input: ScriptGenerationInput) {
    return {
      versions: composer.scriptVersions,
      productName: input.productAnalysis.productName || '신상품',
      category: input.productAnalysis.category || 'General',
    };
  }
}

class StoryboardNormalizer {
  public normalize(raw: ReturnType<StoryboardCollector['collect']>) {
    return raw.versions.map((v) => ({
      versionId: v.versionId,
      versionName: v.versionName,
      totalDurationSeconds: v.totalDurationSeconds,
      lines: v.scriptLines,
    }));
  }
}

class StoryboardAnalyzer {
  public build10DScenes(
    versionId: string,
    lines: Array<{
      lineNumber: number;
      sectionRole: 'HOOK' | 'PROBLEM' | 'EMPATHY' | 'INSIGHT' | 'USP' | 'PROOF' | 'CTA';
      spokenText: string;
      onScreenText: string;
    }>
  ): StoryboardScene10D[] {
    return lines.map((line, idx) => {
      let assetType: StoryboardAssetType = 'UGC';
      let cameraMotion = 'Slow push-in zoom toward subject';
      let soundAndBgm = 'Uplifting lofi beat with subtle transition whoosh';
      let propAndSetting = 'Modern clean apartment living room background';
      let facialExpressionAndEmotion = 'Curious and relatable everyday expression';
      let aiVideoPrompt = 'A real person looking at camera speaking naturally, 4k cinematic';

      switch (line.sectionRole) {
        case 'HOOK':
          assetType = 'UGC';
          cameraMotion = 'Dynamic fast push-in on person speaking';
          soundAndBgm = 'Attention-grabbing sound hook followed by clean voiceover';
          facialExpressionAndEmotion = 'Surprised, engaged, and highly empathetic expression';
          aiVideoPrompt = `Korean person in early 30s speaking directly to camera with engaging expression, natural home living room lighting, authentic selfie style, 4k resolution`;
          break;
        case 'PROBLEM':
          assetType = 'BEFORE_AFTER';
          cameraMotion = 'Handheld slight shake to emphasize discomfort or inconvenience';
          soundAndBgm = 'Subtle low bass sound effect indicating problem or frustration';
          facialExpressionAndEmotion = 'Tired, frustrated, or bothered expression';
          aiVideoPrompt = `Cinematic b-roll of a person feeling tired after work, sitting on sofa stretching back, moody ambient lighting, realistic everyday scene`;
          break;
        case 'EMPATHY':
          assetType = 'LIFESTYLE';
          cameraMotion = 'Smooth panning shot across relaxing home setting';
          soundAndBgm = 'Warm acoustic guitar chords, calming atmosphere';
          facialExpressionAndEmotion = 'Relieved, hopeful, and comforting smile';
          aiVideoPrompt = `Cozy home interior at twilight, warm lamp light, person smiling comfortably while relaxing on couch, cinematic 4k`;
          break;
        case 'INSIGHT':
        case 'USP':
          assetType = 'PRODUCT_SHOT';
          cameraMotion = 'Macro slow orbiting shot around the product highlighting materials';
          soundAndBgm = 'Crisp ASMR sound of product button click and warming indicator chime';
          propAndSetting = 'Minimalist studio tabletop with soft diffused lighting';
          facialExpressionAndEmotion = 'Confident and professional tone';
          aiVideoPrompt = `Macro close-up shot of modern sleek device on clean white marble table, soft studio lighting, ultra sharp focus, high-end commercial look`;
          break;
        case 'PROOF':
          assetType = 'REVIEW_SCREEN';
          cameraMotion = 'Static screen overlay with glowing 4.9 star rating icons appearing';
          soundAndBgm = 'Satisfying pop sound effect as 5 golden stars appear on screen';
          propAndSetting = 'Graphic overlay on top of happy customer usage footage';
          facialExpressionAndEmotion = 'Proud and highly satisfied expression';
          aiVideoPrompt = `Happy customer smiling while using product at home, overlay graphic ready background, bright cheerful lighting, 4k commercial film`;
          break;
        case 'CTA':
          assetType = 'CTA_BANNER';
          cameraMotion = 'Text banner animation sliding up with pulsating call-to-action button';
          soundAndBgm = 'Upbeat promotional finish chime, clear call to action voiceover';
          propAndSetting = 'End-card screen with official brand logo and discount badge';
          facialExpressionAndEmotion = 'Inviting and urgent closing expression';
          aiVideoPrompt = `Clean promotional end card background with modern typography space, product box display on right, sleek lighting`;
          break;
      }

      return {
        sceneNumber: idx + 1,
        role: line.sectionRole,
        assetType,
        durationSeconds: Math.max(4, Math.round(30 / lines.length)),
        visualDescription: `[${assetType}] ${line.onScreenText} - Scene depicting ${line.sectionRole} role`,
        aiVideoPrompt,
        onScreenSubtitle: line.onScreenText,
        voiceoverText: line.spokenText,
        cameraMotion,
        soundAndBgm,
        bRollInsert: `Relevant cutaway B-roll for ${line.sectionRole}`,
        propAndSetting,
        facialExpressionAndEmotion,
      };
    });
  }
}

export class StoryboardBuilderModule {
  private collector = new StoryboardCollector();
  private normalizer = new StoryboardNormalizer();
  private analyzer = new StoryboardAnalyzer();

  public async generateStoryboards(
    input: ScriptGenerationInput,
    composer: CreativeComposerResult
  ): Promise<StoryboardsResult> {
    const raw = this.collector.collect(composer, input);
    const normalized = this.normalizer.normalize(raw);

    const storyboards: StoryboardVersion[] = normalized.map((norm) => ({
      versionId: norm.versionId,
      versionName: norm.versionName,
      totalDurationSeconds: norm.totalDurationSeconds,
      scenes: this.analyzer.build10DScenes(norm.versionId, norm.lines),
    }));

    const rawResult = {
      meta: {
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),
        campaignId: input.meta.campaignId,
      },
      campaignId: input.meta.campaignId,
      storyboards,
    };

    return StoryboardsResultSchema.parse(rawResult);
  }
}
