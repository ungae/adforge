import { AdCreativeResult, CampaignRequest } from '@types/ad-types';
import {
  AdScriptResult,
  CapCutProjectExport,
  CompetitorAnalysisResult,
  EvidenceStoreResult,
  KnowledgeBaseResult,
  MetaAdAnalysisResult,
  ProductAnalysisResult,
  ReviewIntelligenceResult,
  TimelineSpecification,
  UspGenerationResult,
} from '@types/intelligence-types';

export type EventMap = {
  // Existing AdCreative Engine Events
  'campaign:started': { campaign: CampaignRequest };
  'copywriting:completed': { campaignId: string; headline: string };
  'visual:generated': { campaignId: string; assetUrl: string };
  'creative:finished': { creative: AdCreativeResult };
  'pipeline:error': { campaignId: string; error: Error };

  // New v2 End-to-End Intelligence & Video Production Lifecycle Events
  'pipeline:url_received': { productUrl: string; campaignId: string };
  'intelligence:product_analyzed': { result: ProductAnalysisResult };
  'intelligence:reviews_analyzed': { result: ReviewIntelligenceResult };
  'intelligence:competitors_found': { result: CompetitorAnalysisResult };
  'intelligence:meta_ads_analyzed': { result: MetaAdAnalysisResult };
  'intelligence:kb_loaded': { result: KnowledgeBaseResult };
  'strategy:evidence_stored': { result: EvidenceStoreResult };
  'strategy:usp_generated': { result: UspGenerationResult };
  'script:storyboard_created': { result: AdScriptResult };
  'production:timeline_built': { result: TimelineSpecification };
  'export:capcut_ready': { result: CapCutProjectExport };
};

export type EventKey = keyof EventMap;
export type EventListener<K extends EventKey> = (data: EventMap[K]) => void | Promise<void>;

/**
 * Type-safe Event Bus for cross-module decoupled communication
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: { [K in EventKey]?: EventListener<K>[] } = {};

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends EventKey>(event: K, listener: EventListener<K>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
  }

  public async emit<K extends EventKey>(event: K, data: EventMap[K]): Promise<void> {
    const handlers = this.listeners[event] || [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (err) {
        console.error(`Error in event listener for [${event}]:`, err);
      }
    }
  }
}

export const eventBus = EventBus.getInstance();
