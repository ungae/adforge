import { PipelineEngine } from '../src/core/pipeline/pipeline-engine.js';
import { CopywriterModule } from '../src/modules/copywriter/copywriter.module.js';
import { VisualGeneratorModule } from '../src/modules/visual/visual-generator.module.js';
import { LayoutEngineModule } from '../src/modules/layout/layout-engine.module.js';
import { QualityAuditorModule } from '../src/modules/quality/quality-auditor.module.js';
import { ProductAnalyzerModule } from '../src/modules/intelligence/product-analyzer.module.js';
import { ReviewIntelligenceModule } from '../src/modules/intelligence/review-intelligence.module.js';
import { CompetitorFinderModule } from '../src/modules/intelligence/competitor-finder.module.js';
import { MetaAdAnalyzerModule } from '../src/modules/intelligence/meta-ad-analyzer.module.js';
import { KnowledgeBaseLoaderModule } from '../src/modules/intelligence/knowledge-base-loader.module.js';
import { UspGeneratorModule } from '../src/modules/strategy/usp-generator.module.js';
import { EvidenceEngineModule } from '../src/modules/strategy/evidence-engine.module.js';
import { AdScriptGeneratorModule } from '../src/modules/video-production/ad-script-generator.module.js';
import { TimelineBuilderModule } from '../src/modules/video-production/timeline-builder.module.js';
import { PersonaEngineModule } from '../src/modules/intelligence/persona-engine.module.js';
import { WinningAngleEngineModule } from '../src/modules/intelligence/winning-angle-engine.module.js';
import { CreativeStrategyModule } from '../src/modules/creative/creative-strategy.module.js';
import { HookEngineModule } from '../src/modules/creative/hook-engine.module.js';
import { ScriptPlannerModule } from '../src/modules/creative/script-planner.module.js';
import { CreativeComposerModule } from '../src/modules/creative/creative-composer.module.js';
import { StoryboardBuilderModule } from '../src/modules/creative/storyboard-builder.module.js';
import { ScriptQualityScorerModule } from '../src/modules/quality/script-quality-scorer.module.js';
import { CreativeSummaryModule } from '../src/modules/creative/creative-summary.module.js';
import { VideoEditorExportPort } from '../src/core/ports/video-editor-export.port.js';
import { CapCutProjectExport, TimelineSpecification } from '../src/types/intelligence-types.js';
import { HailuoVideoAdapter } from '../src/adapters/video-gen/hailuo-video.adapter.js';
import { GemAudioAdapter } from '../src/adapters/audio-gen/gem-audio.adapter.js';
import { MockLlmAdapter } from '../src/adapters/llm/mock-llm.adapter.js';
import { MockImageAdapter } from '../src/adapters/image-gen/mock-image.adapter.js';

class MockVideoEditorExport implements VideoEditorExportPort {
  async exportProject(params: {
    campaignId: string;
    projectTitle: string;
    timeline: TimelineSpecification;
  }): Promise<CapCutProjectExport> {
    return {
      exportId: `mock_export_${params.campaignId}`,
      timelineId: params.timeline.timelineId,
      projectPath: `C:\\AdForge\\Exports\\${params.campaignId}`,
      draftInfoJsonPath: `C:\\AdForge\\Exports\\${params.campaignId}\\draft_info.json`,
      draftContentJsonPath: `C:\\AdForge\\Exports\\${params.campaignId}\\draft_content.json`,
      draftInfoJson: JSON.stringify({ title: params.projectTitle }),
      draftContentJson: JSON.stringify(params.timeline),
    };
  }
}

async function run() {
  console.log('================================================================');
  console.log('🚀 [AdForge Sprint 4] Quality-First Creative Engine Execution');
  console.log('================================================================\n');

  const llmAdapter = new MockLlmAdapter();
  const imageAdapter = new MockImageAdapter();

  const pipelineEngine = new PipelineEngine(
    new CopywriterModule(llmAdapter),
    new VisualGeneratorModule(imageAdapter, llmAdapter),
    new LayoutEngineModule(),
    new QualityAuditorModule(),
    new ProductAnalyzerModule(),
    new ReviewIntelligenceModule(),
    new CompetitorFinderModule(),
    new MetaAdAnalyzerModule(),
    new KnowledgeBaseLoaderModule(),
    new UspGeneratorModule(),
    new EvidenceEngineModule(),
    new AdScriptGeneratorModule(),
    new TimelineBuilderModule(new HailuoVideoAdapter(), new GemAudioAdapter()),
    new MockVideoEditorExport(),
    new PersonaEngineModule(),
    new WinningAngleEngineModule(),
    new CreativeStrategyModule(),
    new HookEngineModule(),
    new ScriptPlannerModule(),
    new CreativeComposerModule(),
    new StoryboardBuilderModule(),
    new ScriptQualityScorerModule(),
    new CreativeSummaryModule()
  );

  const targetBrands = [
    {
      brand: '오설록',
      url: 'https://brand.naver.com/osulloc/products/10120190602',
      campaignId: 'sprint4_test_osulloc',
    },
    {
      brand: '로지텍',
      url: 'https://brand.naver.com/logitech/products/13544285364',
      campaignId: 'sprint4_test_logitech',
    },
    {
      brand: '슈피겐',
      url: 'https://brand.naver.com/spigen/products/11152814823',
      campaignId: 'sprint4_test_spigen',
    },
    {
      brand: '필립스',
      url: 'https://brand.naver.com/philips/products/11721171220',
      campaignId: 'sprint4_test_philips',
    },
    {
      brand: '코코도르',
      url: 'https://brand.naver.com/cocodor/products/13634012275',
      campaignId: 'sprint4_test_cocodor',
    },
  ];

  for (const b of targetBrands) {
    console.log(`\n================================================================`);
    console.log(`🎯 Executing Pipeline for Brand: [${b.brand}] -> Campaign: ${b.campaignId}`);
    console.log(`🔗 Product URL: ${b.url}`);
    console.log(`================================================================`);

    const start = Date.now();
    const res = await pipelineEngine.executeUrlToVideoPipeline(b.url, {
      campaignSlug: b.campaignId,
      overrideBrand: b.brand,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`✅ [${b.brand}] Completed in ${elapsed}s!`);
    console.log(`  - Primary Strategy: ${res.creativeStrategy.primaryStrategy.winningAngle} (Confidence: ${res.creativeStrategy.primaryStrategy.confidence})`);
    console.log(`  - Composed Script Versions: ${res.composedScripts.scriptVersions.length} versions`);
    console.log(`  - Creative Diversity Score: ${res.scriptScores.creativeDiversityScore} / 100 (${res.scriptScores.auditStatus})`);
    console.log(`  - Generated Summary File: data/${b.campaignId}/17_creative_summary.md`);
  }

  console.log('\n🎉 [Sprint 4] All 5 Target Brands successfully processed!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Pipeline Execution Failed:', err);
  process.exit(1);
});
