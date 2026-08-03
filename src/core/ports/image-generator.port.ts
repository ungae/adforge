import { AdFormat, VisualAssetOutput } from '@types/ad-types';

/**
 * Port interface for Image / Video Asset Generation Providers (DALL-E, Midjourney, Stable Diffusion, Mock)
 */
export interface ImageGeneratorPort {
  generateVisualAsset(params: {
    prompt: string;
    format: AdFormat;
    aspectRatio: string;
    brandName: string;
  }): Promise<VisualAssetOutput>;
}
