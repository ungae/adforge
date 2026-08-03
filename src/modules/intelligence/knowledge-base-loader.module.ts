import { KnowledgeBaseResult, KnowledgeBaseSchema } from '@types/intelligence-types';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Knowledge Base Loader Module (Sprint 3 - Highest Priority in Prompt Context)
 * Loads Markdown rules from an Obsidian vault (e.g. data/kb/) and formats them as top-priority prompt instructions.
 */
export class KnowledgeBaseLoaderModule {
  private defaultVaultPath: string;

  constructor(defaultVaultPath: string = join(process.cwd(), 'data', 'kb')) {
    this.defaultVaultPath = defaultVaultPath;
  }

  /**
   * Ensures default Obsidian KB Markdown documents exist in data/kb/
   */
  public async ensureDefaultVault(vaultPath: string = this.defaultVaultPath): Promise<void> {
    await mkdir(vaultPath, { recursive: true });

    const hookFormulasPath = join(vaultPath, 'hook_formulas.md');
    if (!existsSync(hookFormulasPath)) {
      await writeFile(
        hookFormulasPath,
        `# PAS & Hook Formulas (숏폼 광고 공식)
Tags: #framework #short-form #reels

## Key Insights
- 첫 3초 Hook에서 시청자의 아침 피로감이나 지출 부담 등 구체적 페인을 직접 언급해야 이탈률이 크게 감소함
- 단순 기능 나열 대신 즉각적인 안도감과 문제 해결을 제시할 것
- 질문형("아직도 ~하세요?"), 반전형("사실 ~가 원인입니다") Hook이 릴스에서 가장 클릭률이 높음
`,
        'utf-8'
      );
    }

    const brandTonePath = join(vaultPath, 'brand_tone.md');
    if (!existsSync(brandTonePath)) {
      await writeFile(
        brandTonePath,
        `# Brand Tone and Manner Guide
Tags: #brand/guidelines

## Key Insights
- 전문성과 신뢰감을 유지하면서도 고객의 고통에 진심으로 공감하는 명쾌한 구어체 사용
- 억지스러운 과장 없이 확실한 대조(Before/After)와 명확한 사용 경험(Usage Scene)을 강조할 것
`,
        'utf-8'
      );
    }

    const forbiddenWordsPath = join(vaultPath, 'forbidden_words.md');
    if (!existsSync(forbiddenWordsPath)) {
      await writeFile(
        forbiddenWordsPath,
        `# Forbidden Words (금칙어 및 법적 제한어)
Tags: #compliance #forbidden-words

## Key Insights
- 금칙어 목록: 최고급, 부작용 없음, 무조건 1위, 완치, 만병통치, 평생 보장
- 위어구 사용 시 광고 심의 거부 및 브랜드 신뢰도 하락 발생 가능
`,
        'utf-8'
      );
    }

    const videoGuidelinesPath = join(vaultPath, 'video_guidelines.md');
    if (!existsSync(videoGuidelinesPath)) {
      await writeFile(
        videoGuidelinesPath,
        `# Video Production Guidelines
Tags: #video #short-form #guidelines

## Key Insights
- 15초~30초 이내의 숏폼 리듬감 유지
- 첫 3초 시각적 훅(자막 강제 노출 + 타이트 클로즈업) 필수
- 자막 스타일: 고대비 굵은 고딕체 및 하이라이트 색상 적용
`,
        'utf-8'
      );
    }
  }

  /**
   * Loads Markdown documents from the vault directory and builds a schema-verified KnowledgeBaseResult
   */
  public async loadFromVault(params?: {
    vaultPath?: string;
    queryTags?: string[];
  }): Promise<KnowledgeBaseResult> {
    const targetPath = params?.vaultPath || this.defaultVaultPath;
    await this.ensureDefaultVault(targetPath);

    try {
      const files = await readdir(targetPath);
      const mdFiles = files.filter((f) => f.endsWith('.md'));

      const loadedDocuments = [];
      let toneAndManner = '전문성과 신뢰감을 유지하면서도 고객의 고통에 진심으로 공감하는 명쾌한 구어체 사용';
      let forbiddenWords: string[] = ['최고급', '부작용 없음', '무조건 1위', '완치', '만병통치', '평생 보장'];
      let preferredHookStyles: string[] = [
        '질문형 Hook (고통/불편 직접 지적)',
        '반전형 Hook (기존 인식 깨기)',
        '대조형 Hook (Before vs After)',
      ];
      let videoGuidelines: string[] = [
        '15~30초 이내 숏폼 리듬감 유지',
        '첫 3초 시각적 훅(자막 강제 노출 + 클로즈업) 필수',
        '고대비 굵은 고딕체 자막 사용',
      ];

      for (const file of mdFiles) {
        const filePath = join(targetPath, file);
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const titleLine = lines.find((l) => l.startsWith('# ')) || `# ${file}`;
        const title = titleLine.replace(/^#\s*/, '').trim();

        const tagsLine = lines.find((l) => l.toLowerCase().includes('tags:'));
        const tags = tagsLine
          ? tagsLine
              .replace(/tags:/i, '')
              .split(/\s+/)
              .filter((t) => t.startsWith('#'))
          : ['#kb'];

        const insights = lines
          .filter((l) => l.trim().startsWith('- '))
          .map((l) => l.trim().replace(/^-\s*/, ''));

        loadedDocuments.push({
          filePath,
          title,
          tags,
          content,
          keyInsights: insights.length > 0 ? insights : ['문서 내용 로드 완료'],
          applicableFrameworks: ['Obsidian KB Rule'],
        });

        if (file.includes('forbidden_words')) {
          const wordsLine = lines.find((l) => l.includes('금칙어 목록:'));
          if (wordsLine) {
            forbiddenWords = wordsLine
              .replace(/.*금칙어 목록:\s*/, '')
              .split(',')
              .map((w) => w.trim());
          }
        }
      }

      const rawData = {
        status: 'SUCCESS' as const,
        loadedDocuments,
        brandGuidelineOverride: {
          toneAndManner,
          forbiddenWords,
          preferredHookStyles,
          videoGuidelines,
        },
      };

      return KnowledgeBaseSchema.parse(rawData);
    } catch (err) {
      return {
        status: 'NOT_FOUND',
        reason: `Failed to load vault at ${targetPath}: ${err}`,
        loadedDocuments: [],
        brandGuidelineOverride: {
          toneAndManner: '기본 신뢰성 톤',
          forbiddenWords: [],
          preferredHookStyles: [],
          videoGuidelines: [],
        },
      };
    }
  }

  /**
   * Principle 7: Formats the Knowledge Base result as the HIGHEST PRIORITY prompt instructions
   */
  public static formatPromptContext(kb: KnowledgeBaseResult): string {
    if (kb.status === 'NOT_FOUND') {
      return `### KNOWLEDGE BASE GUIDELINES\n- No specific brand override found. Follow general ethical marketing practices.`;
    }

    const { toneAndManner, forbiddenWords, preferredHookStyles, videoGuidelines } = kb.brandGuidelineOverride;
    return `# ==============================================================================
# 1. KNOWLEDGE BASE GUIDELINES (HIGHEST PRIORITY - OVERRIDES ALL BELOW)
# ==============================================================================
- **Brand Tone & Manner**: ${toneAndManner}
- **Forbidden Words (NEVER USE)**: ${forbiddenWords.join(', ')}
- **Preferred Hook Styles**: ${preferredHookStyles.join('; ')}
- **Video Production Guidelines**: ${videoGuidelines.join('; ')}
- **KB Loaded Documents Count**: ${kb.loadedDocuments.length}`;
  }
}
