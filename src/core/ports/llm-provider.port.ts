import { CampaignRequest, CopywritingOutput } from '@types/ad-types';

/**
 * Port interface for AI Language Model Providers (OpenAI, Gemini, Local, Mock)
 */
export interface LlmProviderPort {
  generateCopywriting(campaign: CampaignRequest): Promise<CopywritingOutput>;
  generateImagePrompt(campaign: CampaignRequest, headline: string): Promise<string>;
}
