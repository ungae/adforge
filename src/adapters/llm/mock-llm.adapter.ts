import { LlmProviderPort } from '@core/ports/llm-provider.port';
import { CampaignRequest, CopywritingOutput } from '@types/ad-types';

/**
 * Mock LLM Adapter for AI Copywriting (Ready to swap with OpenAI / Gemini / Anthropic)
 */
export class MockLlmAdapter implements LlmProviderPort {
  async generateCopywriting(campaign: CampaignRequest): Promise<CopywritingOutput> {
    const tonePrefix =
      campaign.toneAndManner === 'witty'
        ? '[센스 폭발]'
        : campaign.toneAndManner === 'urgent'
        ? '[마감 임박]'
        : '[프리미엄]';

    const headline = `${tonePrefix} ${campaign.brandName} - ${campaign.productName}로 완성하는 최고의 선택!`;
    const subHeadline = `${campaign.targetAudience}를 위한 특별한 경험, 지금 시작해보세요.`;
    const bodyText = `${campaign.coreMessage} 강력한 혜택과 맞춤형 디자인으로 여러분의 일상을 바꿉니다.`;
    const callToAction = '지금 무료로 확인하기';

    return {
      headline,
      subHeadline,
      bodyText,
      callToAction,
      hashtags: [`#${campaign.brandName}`, `#${campaign.productName}`, '#추천', '#할인혜택'],
      abTestVariants: [
        {
          variantName: 'A_DIRECT_BENEFIT',
          headline: `단 7일 한정! ${campaign.productName} 특별 프로모션`,
          callToAction: '혜택 받으러 가기',
        },
        {
          variantName: 'B_EMOTIONAL_STORY',
          headline: `당신이 찾던 그 가치, ${campaign.brandName}에서 만나다`,
          callToAction: '자세히 알아보기',
        },
      ],
    };
  }

  async generateImagePrompt(campaign: CampaignRequest, headline: string): Promise<string> {
    return `Professional commercial photography for ${campaign.brandName} ${campaign.productName}. Topic: ${headline}. Clean modern studio lighting, vibrant colors, aesthetic background suitable for digital ads, ultra-detailed 8k resolution.`;
  }
}
