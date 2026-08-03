import { AdChannel, AdCreativeResult, AdFormat } from '@types/ad-types';

export type LayoutSpec = AdCreativeResult['layoutSpec'];

/**
 * Layout Engine Module: Generates responsive layout rules, typography hierarchy, and color palettes
 */
export class LayoutEngineModule {
  public computeLayoutSpec(format: AdFormat, channel: AdChannel): LayoutSpec {
    const dimensions = this.getDimensions(format);
    const colorPalette = {
      primary: '#4F46E5',   // Indigo
      secondary: '#EC4899', // Pink
      text: '#1F2937',      // Dark Gray
      background: '#F9FAFB' // Off-white
    };
    const typography = {
      fontFamily: 'Pretendard, Inter, sans-serif',
      headerSize: format === 'STORY_REELS' ? 48 : 36,
      bodySize: 18
    };

    return {
      dimensions,
      colorPalette,
      typography
    };
  }

  private getDimensions(format: AdFormat): { width: number; height: number } {
    switch (format) {
      case 'STORY_REELS':
        return { width: 1080, height: 1920 }; // 9:16 vertical
      case 'CAROUSEL_CARD':
        return { width: 1080, height: 1080 }; // 1:1 square
      case 'VIDEO_AD':
        return { width: 1920, height: 1080 }; // 16:9 landscape
      case 'TEXT_COPY':
        return { width: 0, height: 0 };       // Text-only
      case 'HTML5_BANNER':
      case 'STATIC_BANNER':
      default:
        return { width: 1200, height: 628 };  // Standard display banner
    }
  }
}
