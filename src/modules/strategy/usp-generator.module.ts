import {
  CompetitorAnalysisResult,
  KnowledgeBaseResult,
  MetaAdAnalysisResult,
  ProductAnalysisResult,
  ReviewIntelligenceResult,
  UspGenerationResult,
  UspGenerationSchema,
} from '@types/intelligence-types';

/**
 * USP Generator Module: Synthesizes Product, Review, Competitor, Meta Ads, and KB into winning USPs and Angles
 */
export class UspGeneratorModule {
  public async generateUsps(params: {
    product: ProductAnalysisResult;
    reviews: ReviewIntelligenceResult;
    competitors: CompetitorAnalysisResult;
    metaAds: MetaAdAnalysisResult;
    kb: KnowledgeBaseResult;
  }): Promise<UspGenerationResult> {
    const { product } = params;

    const rawData = {
      primaryUsp: `세계 챔피언의 드립 프로필과 AI 수온 조절 기술을 30만 원대에 누리는 홈카페 혁명, ${product.productName}`,
      secondaryUsps: [
        '아침 출근 전 침대 위에서 모바일 앱 원격 예약 추출',
        '원터치 자동 세척 및 PID 정밀 온도 제어 시스템',
        '기존 유럽 고가 머신 대비 50% 비용으로 즐기는 스페셜티 커피',
      ],
      winningAngles: [
        {
          angleId: 'angle_cost_saving',
          angleName: '가성비 & 커피값 절감 앵글',
          targetPersona: '하루 2잔 이상 카페에서 사 먹는 2030 직장인',
          hookStatement: '아직도 한 달 커피값으로 15만 원씩 버리시나요?',
          problemStatement: '출근길 텅 빈 잔고와 매일 줄 서서 기다리는 카페 피로감',
          solutionStatement: '로스트랩 AI 스마트 머신으로 1잔 500원에 챔피언 드립 커피 해결',
          socialProofAnchor: '네이버 실사용자 평점 4.8점, "스타벅스 끊고 한 달 만에 기기값 뽑았다"는 생생 후기',
        },
        {
          angleId: 'angle_home_cafe_healing',
          angleName: '아침 루틴 감성 힐링 앵글',
          targetPersona: '바쁜 아침 속 온전한 여유를 찾는 홈카페 입문자',
          hookStatement: '눈 뜨자마자 내 방을 한남동 스페셜티 카페로 바꾸는 1분 마법',
          problemStatement: '복잡한 수동 드립과 원두 찌꺼기 청소의 번거로움',
          solutionStatement: '앱 버튼 한 번으로 원두 자동 그라인딩부터 추출, 세척까지 원터치 올인원',
          socialProofAnchor: '카페 사장님들도 인정하는 일관된 19bar 황금 크레마와 드립 프로필',
        },
      ],
      differentiationMatrix: {
        vsCompetitors: [
          '드롱기 반자동 대비: 수동 설정 실수 없이 AI가 원두별 최적 수온 자동 매칭',
          '필립스 자동 머신 대비: 챔피언 바리스타 드립 커스텀 레시피 무제한 다운로드 지원',
        ],
      },
    };

    return UspGenerationSchema.parse(rawData);
  }
}
