import { expect, test, describe } from 'bun:test';
import { MockImageAdapter } from '@adapters/image-gen/mock-image.adapter';
import { MockLlmAdapter } from '@adapters/llm/mock-llm.adapter';
import { PipelineEngine } from '@core/pipeline/pipeline-engine';
import { CopywriterModule } from '@modules/copywriter/copywriter.module';
import { LayoutEngineModule } from '@modules/layout/layout-engine.module';
import { QualityAuditorModule } from '@modules/quality/quality-auditor.module';
import { VisualGeneratorModule } from '@modules/visual/visual-generator.module';
import { CampaignRequest } from '@types/ad-types';

describe('AdForge Pipeline Engine', () => {
  test('should generate ad creatives for all specified formats and channels', async () => {
    const llmAdapter = new MockLlmAdapter();
    const imageAdapter = new MockImageAdapter();

    const copywriter = new CopywriterModule(llmAdapter);
    const visual = new VisualGeneratorModule(imageAdapter, llmAdapter);
    const layout = new LayoutEngineModule();
    const quality = new QualityAuditorModule();

    const pipeline = new PipelineEngine(copywriter, visual, layout, quality);

    const campaign: CampaignRequest = {
      id: 'test_camp_1',
      brandName: '테스트 브랜드',
      productName: '테스트 상품',
      targetAudience: '20대',
      coreMessage: '테스트 핵심 메시지',
      toneAndManner: 'professional',
      targetChannels: ['META_INSTAGRAM', 'GOOGLE_DISPLAY'],
      outputFormats: ['STATIC_BANNER', 'STORY_REELS'],
    };

    const creatives = await pipeline.executeCampaignPipeline(campaign);

    // 2 channels * 2 formats = 4 creatives expected
    expect(creatives.length).toBe(4);
    expect(creatives[0].copywriting.headline).toContain('테스트 브랜드');
    expect(creatives[0].auditStatus).toBe('PASSED');
  });

  test('should flag creatives when forbidden words are detected', async () => {
    const llmAdapter = new MockLlmAdapter();
    const imageAdapter = new MockImageAdapter();

    const copywriter = new CopywriterModule(llmAdapter);
    const visual = new VisualGeneratorModule(imageAdapter, llmAdapter);
    const layout = new LayoutEngineModule();
    const quality = new QualityAuditorModule();

    const pipeline = new PipelineEngine(copywriter, visual, layout, quality);

    const campaign: CampaignRequest = {
      id: 'test_camp_2',
      brandName: '최고 브랜드',
      productName: '금칙어테스트',
      targetAudience: '전체',
      coreMessage: '완벽한 효과를 보장합니다',
      toneAndManner: 'witty',
      targetChannels: ['TIKTOK'],
      outputFormats: ['STORY_REELS'],
      forbiddenWords: ['완벽한 효과'], // forbidden phrase in text
    };

    const creatives = await pipeline.executeCampaignPipeline(campaign);
    expect(creatives[0].auditStatus).toBe('FLAGGED');
    expect(creatives[0].auditNotes?.[0]).toContain('금칙어 포함 감지');
  });
});
