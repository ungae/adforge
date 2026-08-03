import { ImageGeneratorPort } from '@core/ports/image-generator.port';
import { AdFormat, VisualAssetOutput } from '@types/ad-types';

/**
 * Mock Image/Video Asset Generator Adapter
 */
export class MockImageAdapter implements ImageGeneratorPort {
  async generateVisualAsset(params: {
    prompt: string;
    format: AdFormat;
    aspectRatio: string;
    brandName: string;
  }): Promise<VisualAssetOutput> {
    const assetId = `asset_${Math.random().toString(36).substring(2, 9)}`;
    const formatSlug = params.format.toLowerCase().replace(/_/g, '-');
    const imageUrl = `https://assets.adforge.ai/mock/${params.brandName}/${formatSlug}_${Date.now()}.png`;

    return {
      assetId,
      format: params.format,
      aspectRatio: params.aspectRatio,
      promptUsed: params.prompt,
      imageUrl,
      altText: `AI generated visual for ${params.brandName} (${params.format})`,
    };
  }
}
