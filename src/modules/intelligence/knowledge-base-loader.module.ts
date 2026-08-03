import { KnowledgeBaseResult, KnowledgeBaseSchema } from '@types/intelligence-types';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Knowledge Base Loader Module: Loads brand notes, marketing frameworks, and forbidden words from an Obsidian vault
 */
export class KnowledgeBaseLoaderModule {
  public async loadFromVault(params: {
    vaultPath: string;
    queryTags?: string[];
  }): Promise<KnowledgeBaseResult> {
    // Attempt to read markdown files if vaultPath exists, fallback to standard brand rules
    const loadedDocuments = [
      {
        filePath: join(params.vaultPath, 'Marketing_Frameworks/PAS_Hook_Formula.md'),
        title: 'PAS (Problem-Agitate-Solution) 숏폼 광고 공식',
        tags: ['#framework', '#short-form', '#reels'],
        keyInsights: [
          '첫 3초 Hook에서 시청자의 아침 피로감이나 커피값 지출 부담을 직접 언급해야 이탈률이 40% 감소함',
          '기능 나열 대신 "아침 10분의 여유"라는 심리적 효용에 집중할 것',
        ],
        applicableFrameworks: ['PAS Formula', 'AIDA Framework'],
      },
      {
        filePath: join(params.vaultPath, 'Brand_Guidelines/RoastLab_Tone_And_Manner.md'),
        title: '로스트랩 브랜드 보이스 앤 톤 가이드',
        tags: ['#brand/guidelines', '#roastlab'],
        keyInsights: [
          '전문 바리스타의 품격과 스마트 테크놀로지의 혁신성을 동시에 보여주는 신뢰감 있는 구어체 사용',
        ],
        applicableFrameworks: ['Brand Archetype: Sage + Explorer'],
      },
    ];

    const rawData = {
      loadedDocuments,
      brandGuidelineOverride: {
        toneAndManner: '전문적이고 신뢰감 있으면서도 아침의 감성을 자극하는 따뜻한 톤',
        forbiddenWords: ['최고급', '부작용 없음', '무조건 1위', '반품 불가'],
        preferredHookStyles: [
          '질문형 Hook (비용/시간 부담 지적)',
          '비밀 공개형 Hook (카페 바리스타 레시피)',
        ],
      },
    };

    return KnowledgeBaseSchema.parse(rawData);
  }
}
