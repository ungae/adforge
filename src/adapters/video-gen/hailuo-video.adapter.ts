import { VideoGeneratorPort } from '@core/ports/video-generator.port';

/**
 * Hailuo AI Video Adapter for high-resolution storyboard scene rendering
 */
export class HailuoVideoAdapter implements VideoGeneratorPort {
  public async generateVideoClip(params: {
    prompt: string;
    durationSeconds: number;
    aspectRatio: '9:16' | '16:9' | '1:1';
    referenceImageUrl?: string;
  }): Promise<{
    clipId: string;
    videoUrl: string;
    durationMs: number;
    aspectRatio: string;
    promptUsed: string;
  }> {
    const clipId = `hailuo_clip_${Math.random().toString(36).substring(2, 9)}`;
    const ratioSlug = params.aspectRatio.replace(':', '-');
    const videoUrl = `https://assets.adforge.ai/video/hailuo/${ratioSlug}_${Date.now()}.mp4`;

    return {
      clipId,
      videoUrl,
      durationMs: params.durationSeconds * 1000,
      aspectRatio: params.aspectRatio,
      promptUsed: params.prompt,
    };
  }
}
