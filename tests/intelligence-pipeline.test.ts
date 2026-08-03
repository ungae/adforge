import { expect, test, describe } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { GemAudioAdapter } from '@adapters/audio-gen/gem-audio.adapter';
import { CapCutExportAdapter } from '@adapters/editor-export/capcut-export.adapter';
import { MockImageAdapter } from '@adapters/image-gen/mock-image.adapter';
import { MockLlmAdapter } from '@adapters/llm/mock-llm.adapter';
import { HailuoVideoAdapter } from '@adapters/video-gen/hailuo-video.adapter';
import { PipelineEngine } from '@core/pipeline/pipeline-engine';
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

describe('AdForge v2 End-to-End URL-to-CapCut Pipeline', () => {
  test('should execute full URL pipeline and save 11 JSON files in data/ directory', async () => {
    // 1. Instantiate Adapters
    const llmAdapter = new MockLlmAdapter();
    const imageAdapter = new MockImageAdapter();
    const gemAudioAdapter = new GemAudioAdapter();
    const hailuoVideoAdapter = new HailuoVideoAdapter();
    const capCutExportAdapter = new CapCutExportAdapter();

    // 2. Instantiate v1 & v2 Modules
    const copywriter = new CopywriterModule(llmAdapter);
    const visualGen = new VisualGeneratorModule(imageAdapter, llmAdapter);
    const layoutEngine = new LayoutEngineModule();
    const qualityAuditor = new QualityAuditorModule();

    const productAnalyzer = new ProductAnalyzerModule();
    const reviewIntelligence = new ReviewIntelligenceModule();
    const competitorFinder = new CompetitorFinderModule();
    const metaAdAnalyzer = new MetaAdAnalyzerModule();
    const kbLoader = new KnowledgeBaseLoaderModule();
    const uspGenerator = new UspGeneratorModule();
    const evidenceEngine = new EvidenceEngineModule();
    const scriptGenerator = new AdScriptGeneratorModule();
    const timelineBuilder = new TimelineBuilderModule(hailuoVideoAdapter, gemAudioAdapter);

    // 3. Initialize Pipeline Engine
    const pipeline = new PipelineEngine(
      copywriter,
      visualGen,
      layoutEngine,
      qualityAuditor,
      productAnalyzer,
      reviewIntelligence,
      competitorFinder,
      metaAdAnalyzer,
      kbLoader,
      uspGenerator,
      evidenceEngine,
      scriptGenerator,
      timelineBuilder,
      capCutExportAdapter
    );

    const testCampaignSlug = 'test_url_campaign_01';
    const testUrl = 'https://brand.naver.com/osulloc/products/10120190602';

    // 4. Run pipeline
    const result = await pipeline.executeUrlToVideoPipeline(testUrl, {
      campaignSlug: testCampaignSlug,
      overrideBrand: '로스트랩 (RoastLab)',
    });

    // 5. Assertions on Review Intelligence additions
    expect(result.reviews.customerLanguage.length).toBeGreaterThan(0);
    expect(
      result.reviews.customerLanguage.some((item: any) =>
        typeof item === 'string' ? item.includes('갓성비') : item.quote.includes('갓성비')
      )
    ).toBe(true);
    expect(result.reviews.purchaseReasons.length).toBeGreaterThan(0);
    expect(
      result.reviews.adCandidateReviews[0].adScore || result.reviews.adCandidateReviews[0].adPotentialScore
    ).toBeGreaterThanOrEqual(80);

    // 6. Assertions on Evidence Engine
    expect(result.evidenceStore.uspEvidences.length).toBeGreaterThan(0);
    expect(result.evidenceStore.uspEvidences[0].uspId).toBe('usp_primary');
    expect(result.evidenceStore.uspEvidences[0].evidenceSources.length).toBeGreaterThanOrEqual(2);
    expect(result.evidenceStore.uspEvidences[0].evidenceSources[0].snippet).toBeDefined();

    // 7. Assertions on CapCut Export & JSON Files in data/ directory
    const dataDir = join(process.cwd(), 'data', testCampaignSlug);
    const expectedJsonFiles = [
      '01_product_analysis.json',
      '02_review_intelligence.json',
      '03_competitor_finder.json',
      '04_meta_ad_analyzer.json',
      '05_knowledge_base_loader.json',
      '06_evidence_store.json',
      '07_usp_generation.json',
      '08_ad_script_storyboard.json',
      '10_timeline_specification.json',
      '11_capcut_draft_project.json',
    ];

    for (const filename of expectedJsonFiles) {
      const filePath = join(dataDir, filename);
      expect(existsSync(filePath)).toBe(true);
    }

    // Ensure CapCut draft_info.json and draft_content.json were generated
    expect(existsSync(result.capCutExport.draftInfoJsonPath)).toBe(true);
    expect(existsSync(result.capCutExport.draftContentJsonPath)).toBe(true);
  }, 90000);
});
