import {
  AdScriptResult,
  AdScriptSchema,
  UspGenerationResult,
  WinningAngle,
} from '@types/intelligence-types';

/**
 * Ad Script Generator Module: Builds a 15s/30s video storyboard (Hook-Problem-Solution-Proof-CTA)
 * with visual prompts for VideoGeneratorPort and voice texts for VoiceGeneratorPort
 */
export class AdScriptGeneratorModule {
  public async generateScript(
    uspResult: UspGenerationResult,
    selectedAngleIndex = 0
  ): Promise<AdScriptResult> {
    const angle: WinningAngle =
      uspResult.winningAngles[selectedAngleIndex] ||
      uspResult.winningAngles[0] || {
        angleId: 'default',
        angleName: 'Default Angle',
        targetPersona: 'All',
        hookStatement: uspResult.primaryUsp,
        problemStatement: 'Problem',
        solutionStatement: 'Solution',
        socialProofAnchor: 'Proof',
      };

    const rawData = {
      scriptId: `script_${Date.now()}`,
      angleId: angle.angleId,
      title: `[숏폼 영상 대본] ${angle.angleName}`,
      totalDurationSeconds: 15,
      scenes: [
        {
          sceneNumber: 1,
          durationSeconds: 3,
          role: 'HOOK' as const,
          visualPrompt:
            'Cinematic close-up of a person looking at a 5,000 KRW cafe receipt with a tired expression in the morning, vertical 9:16 reels style, warm realistic morning sunlight.',
          voiceoverText: angle.hookStatement,
          onScreenCaption: '한 달 커피값 15만 원?! 😱',
        },
        {
          sceneNumber: 2,
          durationSeconds: 3,
          role: 'PROBLEM' as const,
          visualPrompt:
            'Messy kitchen with old manual coffee machine, spilled coffee grounds, stressful morning routine, high detail photography.',
          voiceoverText: angle.problemStatement,
          onScreenCaption: '아침마다 줄 서고 번거로운 드립...',
        },
        {
          sceneNumber: 3,
          durationSeconds: 4,
          role: 'SOLUTION' as const,
          visualPrompt:
            'Sleek silver AI smart coffee machine on a clean minimalist kitchen countertop, person pressing one button on smartphone app, golden espresso crema pouring smoothly.',
          voiceoverText: angle.solutionStatement,
          onScreenCaption: '버튼 한 번으로 챔피언 드립 완성! ☕✨',
        },
        {
          sceneNumber: 4,
          durationSeconds: 2,
          role: 'PROOF' as const,
          visualPrompt:
            'Happy user enjoying coffee on a sunny balcony, review rating overlay with 5 golden stars and glowing verified badge.',
          voiceoverText: angle.socialProofAnchor,
          onScreenCaption: '⭐⭐⭐⭐⭐ 평점 4.8 실사용 검증',
        },
        {
          sceneNumber: 5,
          durationSeconds: 3,
          role: 'CTA' as const,
          visualPrompt:
            'Product box and machine hero shot, promotional banner overlay: "33% Special Launch Discount + 2 Free Beans Packages", swipe up indicator animation.',
          voiceoverText: '지금 론칭 특가 33% 혜택과 원두 2팩 증정을 확인해보세요!',
          onScreenCaption: '⚡ 33% 특가 + 스페셜티 원두 증정! (링크 클릭)',
        },
      ],
    };

    return AdScriptSchema.parse(rawData);
  }
}
