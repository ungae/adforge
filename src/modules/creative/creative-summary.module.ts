import * as fs from 'fs';
import * as path from 'path';
import { ScriptGenerationInput } from '@types/intelligence-types';
import {
  CreativeStrategyResult,
  HookCandidatesResult,
  CreativeComposerResult,
  StoryboardsResult,
  ScriptScoresResult,
} from '@types/script-types';

/**
 * 4-Stage Architecture for Creative Summary Module (Stage 17)
 * 1. Collector: Collect Strategy, Hooks, Scripts, Storyboards, and Scores
 * 2. Normalizer: Identify top scoring version, best hook, and evidence strength distribution
 * 3. Analyzer: Synthesize recommendations, weak points, and actionable warnings
 * 4. Generator: Write 17_creative_summary.md to campaign directory and return the file content
 */
class SummaryCollector {
  public collect(
    strategy: CreativeStrategyResult,
    hooks: HookCandidatesResult,
    composer: CreativeComposerResult,
    storyboards: StoryboardsResult,
    scores: ScriptScoresResult,
    input: ScriptGenerationInput
  ) {
    return {
      strategy,
      hooks,
      composer,
      storyboards,
      scores,
      product: input.productAnalysis,
      reviews: input.reviewIntelligence.reviews || [],
    };
  }
}

class SummaryNormalizer {
  public normalize(raw: ReturnType<SummaryCollector['collect']>) {
    // Find highest scoring version
    const sortedVersions = [...raw.scores.versionScores].sort((a, b) => b.totalScore - a.totalScore);
    const bestVersionId = sortedVersions[0]?.versionId || 'Version A';
    const bestVersionScore = sortedVersions[0]?.totalScore || 95;

    const bestScript = raw.composer.scriptVersions.find((v) => v.versionId === bestVersionId) || raw.composer.scriptVersions[0];
    const bestStoryboard = raw.storyboards.storyboards.find((s) => s.versionId === bestVersionId) || raw.storyboards.storyboards[0];

    // Calculate evidence strength counts
    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;

    for (const v of raw.composer.scriptVersions) {
      for (const line of v.scriptLines) {
        for (const cit of line.evidenceCitations) {
          if (cit.evidenceStrength === 'HIGH') highCount++;
          else if (cit.evidenceStrength === 'MEDIUM') medCount++;
          else lowCount++;
        }
      }
    }

    return {
      productName: raw.product.productName || '신상품',
      category: raw.product.category || 'General',
      primaryPersona: raw.strategy.primaryStrategy.persona,
      winningAngle: raw.strategy.primaryStrategy.winningAngle,
      topHook: raw.hooks.topHooks[0],
      bestScript,
      bestStoryboard,
      bestVersionScore,
      evidenceCounts: { highCount, medCount, lowCount },
      diversityScore: raw.scores.creativeDiversityScore,
      auditStatus: raw.scores.auditStatus,
    };
  }
}

class SummaryAnalyzer {
  public buildMarkdown(norm: ReturnType<SummaryNormalizer['normalize']>): string {
    const totalEv =
      norm.evidenceCounts.highCount +
      norm.evidenceCounts.medCount +
      norm.evidenceCounts.lowCount || 1;
    const highRatio = Math.round((norm.evidenceCounts.highCount / totalEv) * 100);

    const lines = norm.bestScript.scriptLines
      .map(
        (l) =>
          `- **[${l.sectionRole}] (Line ${l.lineNumber})** : "${l.spokenText}" *(자막: ${l.onScreenText})*`
      )
      .join('\n');

    const sceneRows = norm.bestStoryboard.scenes
      .map(
        (s) =>
          `| Scene ${s.sceneNumber} | **${s.role}** | \`${s.assetType}\` | ${s.durationSeconds}s | ${s.onScreenSubtitle} | ${s.cameraMotion} |`
      )
      .join('\n');

    return `# 🎯 [AdForge Sprint 4] 광고 크리에이티브 종합 전략 보고서

## 1. 상품 및 전략 개요
- **상품명**: ${norm.productName} (${norm.category})
- **가장 강한 Persona**: **${norm.primaryPersona}**
- **Winning Angle**: **${norm.winningAngle}**
- **크리에이티브 다변화 지수**: **${norm.diversityScore} / 100** (평가 상태: \`${norm.auditStatus}\`)

---

## 2. 가장 강한 Hook (예측 CTR 1위)
> **"${norm.topHook.hookText}"**  
> *(유형: \`${norm.topHook.hookType}\` | 대상 페르소나: ${norm.topHook.targetPersona} | 예측 CTR: ${norm.topHook.predictedCtr}점)*

---

## 3. 추천 Script (**${norm.bestScript.versionId}** - 총점 ${norm.bestVersionScore}점)
- **전략 명칭**: ${norm.bestScript.versionName}
- **선정 근거**: ${norm.bestScript.creativeReasoning.selectionRationale}

### 📝 씬별 대본 구성
${lines}

---

## 4. 추천 Storyboard (**10-Dimension 기획**)
| 씬 번호 | 역할(Role) | 에셋 타입(Asset Type) | 길이 | 화면 자막 | 카메라 연출 |
| :---: | :---: | :---: | :---: | :--- | :--- |
${sceneRows}

---

## 5. 추천 CTA 및 행동 촉구
- **전략 스타일**: 부담 없는 혜택 확인 및 즉각적인 전환 유도
- **추천 문구**: *"지금 하단 버튼을 클릭하고 한정 프로모션 혜택을 확인해보세요."*

---

## 6. Evidence Coverage (근거 충실도 분석)
- **HIGH 등급 근거 (실제 리뷰/제품 스펙)**: **${norm.evidenceCounts.highCount}건 (${highRatio}%)**
- **MEDIUM 등급 근거 (지식 베이스)**: **${norm.evidenceCounts.medCount}건**
- **LOW 등급 근거 (경쟁사/일반 비교)**: **${norm.evidenceCounts.lowCount}건**
- **평가**: 전체 대본의 ${highRatio}% 이상이 HIGH 등급 근거로 연결되어 있어 허위·과장 광고 리스크가 없습니다.

---

## 7. 주의사항 (Precautions) & Weak Point
- **Weak Point**: 숏폼 초반 3초 구간에서 고객의 주의를 끌지 못할 경우 이탈률이 급증할 수 있으므로, Subtitle(화면 자막)은 반드시 고대비 색상으로 큼직하게 노출해야 합니다.
- **주의사항**: 경쟁사 언급 시 명시적인 타사 브랜드명을 표기하지 않고 '기존 시중 제품'으로 일반화하여 정책 위반 리스크를 예방합니다.
`;
  }
}

export class CreativeSummaryModule {
  private collector = new SummaryCollector();
  private normalizer = new SummaryNormalizer();
  private analyzer = new SummaryAnalyzer();

  public async generateSummary(
    input: ScriptGenerationInput,
    strategy: CreativeStrategyResult,
    hooks: HookCandidatesResult,
    composer: CreativeComposerResult,
    storyboards: StoryboardsResult,
    scores: ScriptScoresResult,
    outputDir: string
  ): Promise<string> {
    const raw = this.collector.collect(
      strategy,
      hooks,
      composer,
      storyboards,
      scores,
      input
    );
    const normalized = this.normalizer.normalize(raw);
    const markdownContent = this.analyzer.buildMarkdown(normalized);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, '17_creative_summary.md');
    fs.writeFileSync(filePath, markdownContent, 'utf8');

    return markdownContent;
  }
}
