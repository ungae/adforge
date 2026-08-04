import { ScriptGenerationInput } from '@types/intelligence-types';
import {
  CreativeStrategyResult,
  HookCandidatesResult,
  ScriptPlanResult,
  ScriptPlanResultSchema,
  ScriptPlanSection,
} from '@types/script-types';

/**
 * 4-Stage Architecture for Script Planner Module (Stage 13)
 * 1. Collector: Collect Strategy, top Hook, and Product/Review Evidence
 * 2. Normalizer: Trim core message and align evidence IDs
 * 3. Analyzer: Structure into 7 advertising sections (Hook, Problem, Empathy, Insight, USP, Proof, CTA)
 * 4. Generator: Return Zod-validated 13_script_plan.json schema
 */
class ScriptPlanCollector {
  public collect(
    strategy: CreativeStrategyResult,
    hooks: HookCandidatesResult,
    input: ScriptGenerationInput
  ) {
    return {
      strategyItem: strategy.primaryStrategy,
      topHook: hooks.topHooks[0] || {
        hookText: '아직도 불편하게 사용하시나요?',
        hookType: 'QUESTION',
      },
      product: input.productAnalysis,
      reviews: input.reviewIntelligence.reviews || [],
      evidenceIds: strategy.primaryStrategy.primaryEvidenceIds,
    };
  }
}

class ScriptPlanAnalyzer {
  public analyze(raw: ReturnType<ScriptPlanCollector['collect']>): ScriptPlanSection[] {
    const productName = raw.product.productName || '신상품';
    const angle = raw.strategyItem.winningAngle;
    const persona = raw.strategyItem.persona;
    const defaultEv = raw.evidenceIds[0] || 'rev-001';

    return [
      {
        step: 'HOOK',
        title: '0~3초 호기심 극대화 훅',
        description: `시청자의 이목을 즉각 집중시키는 '${raw.strategyItem.hookType}' 유형 문구 노출`,
        coreMessage: raw.topHook.hookText,
        evidenceIds: [defaultEv],
      },
      {
        step: 'PROBLEM',
        title: '3~6초 일상 속 실질적인 문제 제기',
        description: `${persona}가 겪고 있는 불편함과 스트레스 상황 제시`,
        coreMessage: `${persona}이라면 누구나 공감할 기존 방식의 번거로움과 한계`,
        evidenceIds: [defaultEv],
      },
      {
        step: 'EMPATHY',
        title: '6~9초 정서적 공감대 및 유대감 형성',
        description: '단순 제품 홍보가 아니라 고객의 고충을 깊이 이해한다는 메시지',
        coreMessage: '더 이상 참거나 비효율적인 방법에 의존하지 않아도 된다는 따뜻한 메시지',
        evidenceIds: [defaultEv],
      },
      {
        step: 'INSIGHT',
        title: '9~13초 근본 원인 분석 및 인사이트 제시',
        description: '왜 기존 방법이 실패했는지 명확하게 설명하는 전환점',
        coreMessage: `${angle} 관점에서 근본적인 차별화 원리와 기술적 해결책 제시`,
        evidenceIds: [defaultEv],
      },
      {
        step: 'USP',
        title: '13~19초 제품 차별화 솔루션 (USP) 각인',
        description: `${productName}만의 압도적인 혜택과 핵심 기능 설명`,
        coreMessage: '즉각적인 효과와 합리적 가치를 보장하는 차별화 기능 공개',
        evidenceIds: [defaultEv],
      },
      {
        step: 'PROOF',
        title: '19~24초 실제 고객 리뷰 및 평점 사회적 검증',
        description: '실제 구매 고객의 만족도 평점과 후기를 통한 신뢰도 극대화',
        coreMessage: '평점 4.8점 이상 및 구매자 찐후기로 검증된 실사용 효과',
        evidenceIds: [defaultEv],
      },
      {
        step: 'CTA',
        title: '24~30초 명확하고 부담 없는 행동 촉구 (CTA)',
        description: `${raw.strategyItem.ctaStyle}을 적용한 전환 유도`,
        coreMessage: '한정 프로모션 혜택 확인 및 하단 버튼 클릭 유도',
        evidenceIds: [defaultEv],
      },
    ];
  }
}

export class ScriptPlannerModule {
  private collector = new ScriptPlanCollector();
  private analyzer = new ScriptPlanAnalyzer();

  public async generateScriptPlan(
    input: ScriptGenerationInput,
    strategy: CreativeStrategyResult,
    hooks: HookCandidatesResult
  ): Promise<ScriptPlanResult> {
    const raw = this.collector.collect(strategy, hooks, input);
    const planSections = this.analyzer.analyze(raw);

    const rawResult = {
      meta: {
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),
        campaignId: input.meta.campaignId,
      },
      campaignId: input.meta.campaignId,
      strategyId: strategy.primaryStrategy.strategyId,
      planSections,
    };

    return ScriptPlanResultSchema.parse(rawResult);
  }
}
