/**
 * Supported Advertising Output Formats
 */
export type AdFormat =
  | 'STATIC_BANNER'   // Display PNG/JPG Banner (e.g., 1200x628, 1080x1080)
  | 'CAROUSEL_CARD'   // Social Media Carousel (Multi-slide cards)
  | 'STORY_REELS'     // Vertical Short Video / Story (9:16, e.g., TikTok/Reels)
  | 'VIDEO_AD'        // Standard Video Ad (16:9 MP4)
  | 'TEXT_COPY'       // Text-only Search / Feed Copy
  | 'HTML5_BANNER';   // Animated HTML5 Banner

/**
 * Supported Advertising Channels
 */
export type AdChannel =
  | 'META_INSTAGRAM'
  | 'META_FACEBOOK'
  | 'GOOGLE_DISPLAY'
  | 'TIKTOK'
  | 'NAVER_DA - GFA'
  | 'KAKAO_MOMENT';

/**
 * Brand & Campaign Target Specifications
 */
export interface CampaignRequest {
  id: string;
  brandName: string;
  productName: string;
  targetAudience: string;
  coreMessage: string;
  toneAndManner: 'professional' | 'witty' | 'emotional' | 'urgent' | 'minimalist';
  targetChannels: AdChannel[];
  outputFormats: AdFormat[];
  keywords?: string[];
  forbiddenWords?: string[];
}

/**
 * Copywriting Output Structure (with A/B Test Variants)
 */
export interface CopywritingOutput {
  headline: string;
  subHeadline: string;
  bodyText: string;
  callToAction: string;
  hashtags?: string[];
  abTestVariants: {
    variantName: string;
    headline: string;
    callToAction: string;
  }[];
}

/**
 * Visual Asset Output Structure
 */
export interface VisualAssetOutput {
  assetId: string;
  format: AdFormat;
  aspectRatio: string; // e.g., '1:1', '16:9', '9:16'
  promptUsed: string;
  imageUrl: string;
  altText: string;
}

/**
 * Final Layout & Creative Assembly Specification
 */
export interface AdCreativeResult {
  creativeId: string;
  campaignId: string;
  channel: AdChannel;
  format: AdFormat;
  copywriting: CopywritingOutput;
  visualAsset: VisualAssetOutput;
  layoutSpec: {
    dimensions: { width: number; height: number };
    colorPalette: { primary: string; secondary: string; text: string; background: string };
    typography: { fontFamily: string; headerSize: number; bodySize: number };
  };
  auditStatus: 'PASSED' | 'FLAGGED' | 'NEEDS_REVIEW';
  auditNotes?: string[];
  createdAt: Date;
}
