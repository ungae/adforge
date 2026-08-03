import { LlmProviderPort } from '@core/ports/llm-provider.port';
import { eventBus } from '@core/events/event-bus';
import { CampaignRequest, CopywritingOutput } from '@types/ad-types';

/**
 * Copywriter Module: Handles AI copy generation, A/B variant creation, and tone-and-manner styling
 */
export class CopywriterModule {
  constructor(private readonly llmProvider: LlmProviderPort) {}

  public async createCopy(campaign: CampaignRequest): Promise<CopywritingOutput> {
    const copy = await this.llmProvider.generateCopywriting(campaign);

    await eventBus.emit('copywriting:completed', {
      campaignId: campaign.id,
      headline: copy.headline,
    });

    return copy;
  }
}
