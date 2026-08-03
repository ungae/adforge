/**
 * Vendor-Agnostic Port for AI Video Clip Generation
 * Implementations can wrap Hailuo AI, Minimax, Runway Gen-3, Sora, etc.
 */
export interface VideoGeneratorPort {
  generateVideoClip(params: {
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
  }>;
}
