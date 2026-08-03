import { eventBus } from '@core/events/event-bus';
import { jsonStorage } from '@core/storage/json-storage.service';
import { VideoEditorExportPort } from '@core/ports/video-editor-export.port';
import { CopywriterModule } from '@modules/copywriter/copywriter.module';
import { LayoutEngineModule } from '@modules/layout/layout-engine.module';
import { QualityAuditorModule } from '@modules/quality/quality-auditor.module';
import { VisualGeneratorModule } from '@modules/visual/visual-generator.module';
import { CompetitorFinderModule } from '@modules/intelligence/competitor-finder.module';
import { KnowledgeBaseLoaderModule } from '@modules/intelligence/knowledge-base-loader.module';
import { MetaAdAnalyzerModule } from '@modules/intelligence/meta-ad-analyzer.module';
import { ProductAnalyzerModule } from '@modules/intelligence/product-analyzer.module';
import { ReviewIntelligenceModule } from '@modules/intelligence/review-intelligence.module';
import { EvidenceEngineModule } from '@modules/strategy/evidence-engine.module';
import { UspGeneratorModule } from '@modules/strategy/usp-generator.module';
import { AdScriptGeneratorModule } from '@modules/video-production/ad-script-generator.module';
import { TimelineBuilderModule } from '@modules/video-production/timeline-builder.module';
import { AdCreativeResult, CampaignRequest } from '@types/ad-types';
import {
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

export interface EndToEndPipelineResult {
  campaignId: string;
  productUrl: string;
  product: ProductAnalysisResult;
  reviews: ReviewIntelligenceResult;
  competitors: CompetitorAnalysisResult;
  metaAds: MetaAdAnalysisResult;
  kb: KnowledgeBaseResult;
  evidenceStore: EvidenceStoreResult;
  uspResult: UspGenerationResult;
  scriptResult: any;
  timeline: TimelineSpecification;
  capCutExport: CapCutProjectExport;
  creatives: AdCreativeResult[];
}

/**
 * Pipeline Engine: Orchestrates both the v1 Creative Banner engine and v2 End-to-End URL-to-CapCut pipeline
 */
export class PipelineEngine {
  constructor(
    private readonly copywriter: CopywriterModule,
    private readonly visualGen: VisualGeneratorModule,
    private readonly layoutEngine: LayoutEngineModule,
    private readonly qualityAuditor: QualityAuditorModule,
    // v2 Intelligence & Production Modules
    private readonly productAnalyzer: ProductAnalyzerModule,
    private readonly reviewIntelligence: ReviewIntelligenceModule,
    private readonly competitorFinder: CompetitorFinderModule,
    private readonly metaAdAnalyzer: MetaAdAnalyzerModule,
    private readonly kbLoader: KnowledgeBaseLoaderModule,
    private readonly uspGenerator: UspGeneratorModule,
    private readonly evidenceEngine: EvidenceEngineModule,
    private readonly scriptGenerator: AdScriptGeneratorModule,
    private readonly timelineBuilder: TimelineBuilderModule,
    private readonly editorExport: VideoEditorExportPort
  ) {}

  /**
   * Executes the v2 End-to-End automated video and ad creation workflow from a single Product URL
   */
  public async executeUrlToVideoPipeline(
    productUrl: string,
    options?: { overrideBrand?: string; vaultPath?: string; campaignSlug?: string }
  ): Promise<EndToEndPipelineResult> {
    const campaignId = options?.campaignSlug || `url_camp_${Date.now()}`;
    const vaultPath = options?.vaultPath || './obsidian_vault';

    await eventBus.emit('pipeline:url_received', { productUrl, campaignId });

    // -----------------------------------------------------------------------
    // Step 1: Parallel Execution of Independent Intelligence Modules
    // -----------------------------------------------------------------------
    const product = await this.productAnalyzer.analyzeUrl(productUrl, {
      campaignId,
      overrideBrand: options?.overrideBrand,
    });
    const [reviews, kb] = await Promise.all([
      this.reviewIntelligence.analyzeReviews(productUrl, { campaignId }),
      this.kbLoader.loadFromVault({ vaultPath }),
    ]);

    await jsonStorage.saveStepResult(campaignId, '01_product_analysis.json', product);
    await eventBus.emit('intelligence:product_analyzed', { result: product });

    await jsonStorage.saveStepResult(campaignId, '02_review_intelligence.json', reviews);
    await jsonStorage.saveStepResult(campaignId, '03_review_intelligence.json', reviews);
    await jsonStorage.saveStepResult(campaignId, 'customer_language.json', reviews.customerLanguage);
    await eventBus.emit('intelligence:reviews_analyzed', { result: reviews });

    await jsonStorage.saveStepResult(campaignId, '05_knowledge_base_loader.json', kb);
    await eventBus.emit('intelligence:kb_loaded', { result: kb });

    // -----------------------------------------------------------------------
    // Step 2: Dependent Intelligence Modules (Competitor & Meta Ad analysis)
    // -----------------------------------------------------------------------
    const competitors = await this.competitorFinder.findCompetitors({
      productName: product.productName,
      category: product.category,
      coreFeatures: product.coreFeatures,
    });
    await jsonStorage.saveStepResult(campaignId, '03_competitor_finder.json', competitors);
    await eventBus.emit('intelligence:competitors_found', { result: competitors });

    const metaAds = await this.metaAdAnalyzer.analyzeAds({
      keywords: product.coreFeatures,
      competitorBrands: competitors.competitors.map((c) => c.brandName),
    });
    await jsonStorage.saveStepResult(campaignId, '04_meta_ad_analyzer.json', metaAds);
    await eventBus.emit('intelligence:meta_ads_analyzed', { result: metaAds });

    // -----------------------------------------------------------------------
    // Step 3: Strategy - USP Generation & Evidence Engine Tracing
    // -----------------------------------------------------------------------
    const uspResult = await this.uspGenerator.generateUsps({
      product,
      reviews,
      competitors,
      metaAds,
      kb,
    });
    await jsonStorage.saveStepResult(campaignId, '07_usp_generation.json', uspResult);
    await eventBus.emit('strategy:usp_generated', { result: uspResult });

    const evidenceStore = this.evidenceEngine.createEvidenceStore({
      campaignId,
      product,
      reviews,
      competitors,
      metaAds,
      kb,
      uspResult,
    });
    await jsonStorage.saveStepResult(campaignId, '06_evidence_store.json', evidenceStore);
    await eventBus.emit('strategy:evidence_stored', { result: evidenceStore });

    // -----------------------------------------------------------------------
    // Step 4: Video Script & Storyboard Generation
    // -----------------------------------------------------------------------
    const scriptResult = await this.scriptGenerator.generateScript(uspResult, 0);
    await jsonStorage.saveStepResult(campaignId, '08_ad_script_storyboard.json', scriptResult);
    await eventBus.emit('script:storyboard_created', { result: scriptResult });

    // -----------------------------------------------------------------------
    // Step 5: Video & Media Production Layer (Hailuo/Gem via Adapters -> Timeline)
    // -----------------------------------------------------------------------
    const timeline = await this.timelineBuilder.buildTimeline(scriptResult, '9:16');
    await jsonStorage.saveStepResult(campaignId, '10_timeline_specification.json', timeline);
    await eventBus.emit('production:timeline_built', { result: timeline });

    // -----------------------------------------------------------------------
    // Step 6: CapCut Draft Project Export
    // -----------------------------------------------------------------------
    const capCutExport = await this.editorExport.exportProject({
      campaignId,
      projectTitle: `${product.productName} 숏폼 광고 Draft`,
      timeline,
    });
    await jsonStorage.saveStepResult(campaignId, '11_capcut_draft_project.json', capCutExport);
    await eventBus.emit('export:capcut_ready', { result: capCutExport });

    // -----------------------------------------------------------------------
    // Step 7: Also run static & carousel banner creatives via v1 engine
    // -----------------------------------------------------------------------
    const bannerCampaign: CampaignRequest = {
      id: campaignId,
      brandName: options?.overrideBrand || '로스트랩 (RoastLab)',
      productName: product.productName,
      targetAudience: product.targetDemographic.ageRange + ' 직장인',
      coreMessage: uspResult.primaryUsp,
      toneAndManner: 'witty',
      targetChannels: ['META_INSTAGRAM', 'GOOGLE_DISPLAY'],
      outputFormats: ['STATIC_BANNER', 'CAROUSEL_CARD'],
      forbiddenWords: kb.brandGuidelineOverride.forbiddenWords,
    };

    const creatives = await this.executeCampaignPipeline(bannerCampaign);

    return {
      campaignId,
      productUrl,
      product,
      reviews,
      competitors,
      metaAds,
      kb,
      evidenceStore,
      uspResult,
      scriptResult,
      timeline,
      capCutExport,
      creatives,
    };
  }

  /**
   * Executes the full automated ad generation pipeline for a campaign (v1 banner/carousel engine)
   */
  public async executeCampaignPipeline(campaign: CampaignRequest): Promise<AdCreativeResult[]> {
    await eventBus.emit('campaign:started', { campaign });

    const results: AdCreativeResult[] = [];

    const copywriting = await this.copywriter.createCopy(campaign);

    for (const channel of campaign.targetChannels) {
      for (const format of campaign.outputFormats) {
        const visualAsset = await this.visualGen.createVisualForFormat(
          campaign,
          format,
          copywriting.headline
        );

        const layoutSpec = this.layoutEngine.computeLayoutSpec(format, channel);

        const partialCreative: Omit<AdCreativeResult, 'auditStatus' | 'auditNotes'> = {
          creativeId: `cr_${Math.random().toString(36).substring(2, 9)}`,
          campaignId: campaign.id,
          channel,
          format,
          copywriting,
          visualAsset,
          layoutSpec,
          createdAt: new Date(),
        };

        const { status, notes } = await this.qualityAuditor.auditCreative(campaign, partialCreative);

        const fullCreative: AdCreativeResult = {
          ...partialCreative,
          auditStatus: status,
          auditNotes: notes,
        };

        await eventBus.emit('creative:finished', { creative: fullCreative });
        results.push(fullCreative);
      }
    }

    return results;
  }
}
