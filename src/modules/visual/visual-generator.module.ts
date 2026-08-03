import { ImageGeneratorPort } from '@core/ports/image-generator.port';
import { LlmProviderPort } from '@core/ports/llm-provider.port';
import { eventBus } from '@core/events/event-bus';
import { AdFormat, CampaignRequest, VisualAssetOutput } from '@types/ad-types';

/**
 * Visual Generator Module: Maps ad format requirements to aspect ratios and generates visual assets
 */
export class VisualGeneratorModule {
  constructor(
    private readonly imageGen: ImageGeneratorPort,
    private readonly llmProvider: LlmProviderPort
  ) {}

  public async createVisualForFormat(
    campaign: CampaignRequest,
    format: AdFormat,
    headline: string
  ): Promise<VisualAssetOutput> {
    const aspectRatio = this.resolveAspectRatio(format);
    const prompt = await this.llmProvider.generateImagePrompt(campaign, headline);

    const asset = await this.imageGen.generateVisualAsset({
      prompt,
      format,
      aspectRatio,
      brandName: campaign.brandName,
    });

    await eventBus.emit('visual:generated', {
      campaignId: campaign.id,
      assetUrl: asset.imageUrl,
    });

    return asset;
  }

  private resolveAspectRatio(format: AdFormat): string {
    switch (format) {
      case 'STORY_REELS':
        return '9:16';
      case 'VIDEO_AD':
        return '16:9';
      case 'STATIC_BANNER':
      case 'HTML5_BANNER':
        return '1.91:1'; // e.g., 1200x628
      case 'CAROUSEL_CARD':
      default:
        return '1:1';
    }
  }
}
