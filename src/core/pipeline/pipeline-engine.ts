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
import { PersonaEngineModule } from '@modules/intelligence/persona-engine.module';
import { WinningAngleEngineModule } from '@modules/intelligence/winning-angle-engine.module';
import { EvidenceEngineModule } from '@modules/strategy/evidence-engine.module';
import { UspGeneratorModule } from '@modules/strategy/usp-generator.module';
import { AdScriptGeneratorModule } from '@modules/video-production/ad-script-generator.module';
import { TimelineBuilderModule } from '@modules/video-production/timeline-builder.module';
import { AdCreativeResult, CampaignRequest } from '@types/ad-types';
import {
  CapCutProjectExport,
  CompetitorAnalysisResult,
  CompetitorAnalysisSchema,
  EvidenceEngineResult,
  EvidenceEngineSchema,
  EvidenceStoreResult,
  KnowledgeBaseResult,
  KnowledgeBaseSchema,
  MetaAdAnalysisResult,
  MetaAdAnalysisSchema,
  PersonaEngineResult,
  PersonaEngineSchema,
  ProductAnalysisResult,
  ProductAnalysisSchema,
  ReviewIntelligenceResult,
  ReviewIntelligenceSchema,
  ScriptGenerationInput,
  ScriptGenerationInputSchema,
  TimelineSpecification,
  UspGenerationResult,
  UspGenerationSchema,
  WinningAngleEngineResult,
  WinningAngleEngineSchema,
} from '@types/intelligence-types';

export interface EndToEndPipelineResult {
  campaignId: string;
  productUrl: string;
  product: ProductAnalysisResult;
  reviews: ReviewIntelligenceResult;
  competitors: CompetitorAnalysisResult;
  metaAds: MetaAdAnalysisResult;
  kb: KnowledgeBaseResult;
  personas: PersonaEngineResult;
  winningAngles: WinningAngleEngineResult;
  evidenceStore: EvidenceStoreResult;
  evidenceIndex: EvidenceEngineResult;
  uspResult: UspGenerationResult;
  scriptInput: ScriptGenerationInput;
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
    private readonly editorExport: VideoEditorExportPort,
    // Optional Sprint 3 additions:
    private readonly personaEngine: PersonaEngineModule = new PersonaEngineModule(),
    private readonly winningAngleEngine: WinningAngleEngineModule = new WinningAngleEngineModule()
  ) {}

  /**
   * Executes the v2 End-to-End automated video and ad creation workflow from a single Product URL
   * Strictly enforces Stages 01-10 with Knowledge Base priority and Schema-verified Pipeline Resume.
   */
  public async executeUrlToVideoPipeline(
    productUrl: string,
    options?: { overrideBrand?: string; vaultPath?: string; campaignSlug?: string }
  ): Promise<EndToEndPipelineResult> {
    const campaignId = options?.campaignSlug || `url_camp_${Date.now()}`;
    const vaultPath = options?.vaultPath || './obsidian_vault';

    await eventBus.emit('pipeline:url_received', { productUrl, campaignId });

    // -----------------------------------------------------------------------
    // Stage 01: Product Analyzer (01_product_analysis.json)
    // -----------------------------------------------------------------------
    let product = await jsonStorage.loadAndValidate(campaignId, '01_product_analysis.json', ProductAnalysisSchema);
    if (!product) {
      product = await this.productAnalyzer.analyzeUrl(productUrl, {
        campaignId,
        overrideBrand: options?.overrideBrand,
      });
      await jsonStorage.saveStepResult(campaignId, '01_product_analysis.json', product);
    }
    await eventBus.emit('intelligence:product_analyzed', { result: product });

    // -----------------------------------------------------------------------
    // Stage 02: Review Intelligence (02_review_intelligence.json)
    // -----------------------------------------------------------------------
    let reviews = await jsonStorage.loadAndValidate(campaignId, '02_review_intelligence.json', ReviewIntelligenceSchema);
    if (!reviews) {
      reviews = await this.reviewIntelligence.analyzeReviews(productUrl, { campaignId });
      await jsonStorage.saveStepResult(campaignId, '02_review_intelligence.json', reviews);
      await jsonStorage.saveStepResult(campaignId, '03_review_intelligence.json', reviews);
      await jsonStorage.saveStepResult(campaignId, 'customer_language.json', reviews.customerLanguage);
    }
    await eventBus.emit('intelligence:reviews_analyzed', { result: reviews });

    // -----------------------------------------------------------------------
    // Stage 03: Knowledge Base Loader (05_knowledge_base.json - Highest Priority)
    // -----------------------------------------------------------------------
    let kb = await jsonStorage.loadAndValidate(campaignId, '05_knowledge_base.json', KnowledgeBaseSchema);
    if (!kb) {
      kb = await this.kbLoader.loadFromVault({ vaultPath });
      await jsonStorage.saveStepResult(campaignId, '05_knowledge_base.json', kb);
      await jsonStorage.saveStepResult(campaignId, '05_knowledge_base_loader.json', kb);
    }
    await eventBus.emit('intelligence:kb_loaded', { result: kb });

    // -----------------------------------------------------------------------
    // Stage 04: Competitor Finder (04_competitor_analysis.json)
    // -----------------------------------------------------------------------
    let competitors = await jsonStorage.loadAndValidate(campaignId, '04_competitor_analysis.json', CompetitorAnalysisSchema);
    if (!competitors) {
      competitors = await this.competitorFinder.findCompetitors({
        productName: product.productName,
        category: product.category,
        coreFeatures: product.coreFeatures,
        campaignId,
      });
      await jsonStorage.saveStepResult(campaignId, '04_competitor_analysis.json', competitors);
      await jsonStorage.saveStepResult(campaignId, '03_competitor_finder.json', competitors);
    }
    await eventBus.emit('intelligence:competitors_found', { result: competitors });

    // -----------------------------------------------------------------------
    // Stage 05: Meta Ad Analyzer (05_meta_ad_analysis.json)
    // -----------------------------------------------------------------------
    let metaAds = await jsonStorage.loadAndValidate(campaignId, '05_meta_ad_analysis.json', MetaAdAnalysisSchema);
    if (!metaAds) {
      metaAds = await this.metaAdAnalyzer.analyzeAds({
        keywords: product.coreFeatures,
        competitorBrands: competitors.competitors.map((c) => c.brand || c.brandName),
        campaignId,
      });
      await jsonStorage.saveStepResult(campaignId, '05_meta_ad_analysis.json', metaAds);
      await jsonStorage.saveStepResult(campaignId, '04_meta_ad_analyzer.json', metaAds);
    }
    await eventBus.emit('intelligence:meta_ads_analyzed', { result: metaAds });

    // -----------------------------------------------------------------------
    // Stage 06: Persona Engine (06_personas.json -> Min 5 Personas + 100% EvidenceIds)
    // -----------------------------------------------------------------------
    let personas = await jsonStorage.loadAndValidate(campaignId, '06_personas.json', PersonaEngineSchema);
    if (!personas) {
      personas = await this.personaEngine.generatePersonas({
        reviewIntelligence: reviews,
        competitorAnalysis: competitors,
        knowledgeBase: kb,
        campaignId,
      });
      await jsonStorage.saveStepResult(campaignId, '06_personas.json', personas);
    }
    await eventBus.emit('intelligence:personas_generated', { result: personas });

    // -----------------------------------------------------------------------
    // Stage 07: Winning Angle Engine (07_winning_angles.json -> Min 3 Angles/Persona)
    // -----------------------------------------------------------------------
    let winningAngles = await jsonStorage.loadAndValidate(campaignId, '07_winning_angles.json', WinningAngleEngineSchema);
    if (!winningAngles) {
      winningAngles = await this.winningAngleEngine.generateAngles({
        personasResult: personas,
        reviewIntelligence: reviews,
        campaignId,
      });
      await jsonStorage.saveStepResult(campaignId, '07_winning_angles.json', winningAngles);
    }
    await eventBus.emit('intelligence:winning_angles_generated', { result: winningAngles });

    // -----------------------------------------------------------------------
    // Stage 08: USP Generation (08_usp_generation.json -> 7 Advertising USP Types)
    // -----------------------------------------------------------------------
    let uspResult = await jsonStorage.loadAndValidate(campaignId, '08_usp_generation.json', UspGenerationSchema);
    if (!uspResult) {
      uspResult = await this.uspGenerator.generateUsps({
        product,
        reviews,
        competitors,
        metaAds,
        kb,
        campaignId,
      });
      uspResult.winningAngles = winningAngles.winningAngles.map((a, idx) => ({
        angleId: a.angleId,
        angleName: a.angle,
        targetPersona: a.persona,
        hookStatement: a.hook,
        problemStatement: a.pain,
        solutionStatement: a.angle,
        socialProofAnchor: '4.8 평점 인증 및 고객 구매 후기',
      }));
      await jsonStorage.saveStepResult(campaignId, '08_usp_generation.json', uspResult);
      await jsonStorage.saveStepResult(campaignId, '07_usp_generation.json', uspResult);
    }
    await eventBus.emit('strategy:usp_generated', { result: uspResult });

    // -----------------------------------------------------------------------
    // Stage 09: Evidence Engine (09_evidence.json -> Provenance Indexing 01-08)
    // -----------------------------------------------------------------------
    let evidenceIndex = await jsonStorage.loadAndValidate(campaignId, '09_evidence.json', EvidenceEngineSchema);
    if (!evidenceIndex) {
      evidenceIndex = await this.evidenceEngine.buildEvidenceIndex({
        product,
        reviews,
        competitors,
        metaAds,
        personas,
        winningAngles,
        usps: uspResult,
        campaignId,
      });
      await jsonStorage.saveStepResult(campaignId, '09_evidence.json', evidenceIndex);
    }

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
    // Stage 10: Script Generation Input (10_script_generation_input.json)
    // ** THE SINGLE SOURCE OF TRUTH FOR SPRINT 4 SCRIPT GENERATOR **
    // -----------------------------------------------------------------------
    const rawScriptInput = {
      meta: {
        schemaVersion: '1.0',
        pipelineVersion: 'Sprint3',
        generatedAt: new Date().toISOString(),
        generatorVersion: 'AdForge v2',
        campaignId,
        sourceUrl: productUrl,
      },
      campaignId,
      sourceUrl: productUrl,
      productAnalysis: product,
      reviewIntelligence: reviews,
      competitorAnalysis: competitors,
      metaAdAnalysis: metaAds,
      knowledgeBase: kb,
      personas,
      winningAngles,
      uspGeneration: uspResult,
      evidenceStore: evidenceStore,
    };
    const scriptInput = ScriptGenerationInputSchema.parse(rawScriptInput);
    await jsonStorage.saveStepResult(campaignId, '10_script_generation_input.json', scriptInput);
    await eventBus.emit('intelligence:script_input_ready', { result: scriptInput });

    // -----------------------------------------------------------------------
    // Downstream Production Layers (Script -> Timeline -> CapCut Export)
    // -----------------------------------------------------------------------
    const scriptResult = await this.scriptGenerator.generateScript(uspResult, 0);
    await jsonStorage.saveStepResult(campaignId, '08_ad_script_storyboard.json', scriptResult);
    await eventBus.emit('script:storyboard_created', { result: scriptResult });

    const timeline = await this.timelineBuilder.buildTimeline(scriptResult, '9:16');
    await jsonStorage.saveStepResult(campaignId, '10_timeline_specification.json', timeline);
    await eventBus.emit('production:timeline_built', { result: timeline });

    const capCutExport = await this.editorExport.exportProject({
      campaignId,
      projectTitle: `${product.productName} 숏폼 광고 Draft`,
      timeline,
    });
    await jsonStorage.saveStepResult(campaignId, '11_capcut_draft_project.json', capCutExport);
    await eventBus.emit('export:capcut_ready', { result: capCutExport });

    // Also run static & carousel banner creatives via v1 engine
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
      personas,
      winningAngles,
      evidenceStore,
      evidenceIndex,
      uspResult,
      scriptInput,
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
