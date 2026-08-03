import { VideoEditorExportPort } from '@core/ports/video-editor-export.port';
import { CapCutProjectExport, TimelineSpecification } from '@types/intelligence-types';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

/**
 * CapCut Export Adapter: Generates draft_info.json & draft_content.json compatible with CapCut Desktop / Web
 */
export class CapCutExportAdapter implements VideoEditorExportPort {
  public async exportProject(params: {
    campaignId: string;
    projectTitle: string;
    timeline: TimelineSpecification;
    outputDir?: string;
  }): Promise<CapCutProjectExport> {
    const safeCampaignId = params.campaignId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const exportId = `capcut_draft_${Date.now()}`;
    const baseDir = params.outputDir || join(process.cwd(), 'data', safeCampaignId, 'capcut_project');

    await mkdir(baseDir, { recursive: true });

    // 1. Build draft_info.json (Meta information of the draft project)
    const draftInfo = {
      draft_id: exportId,
      draft_name: params.projectTitle,
      draft_fold_path: baseDir,
      duration: params.timeline.durationMs * 1000, // microsecond units in CapCut
      fps: 30,
      width: 1080,
      height: 1920,
      create_time: Date.now(),
    };

    // 2. Build draft_content.json (Tracks: video, audio, text subtitles)
    const draftContent = {
      id: exportId,
      tracks: [
        {
          id: 'track_video_01',
          type: 'video',
          segments: params.timeline.videoTrack.map((clip) => ({
            id: clip.id,
            source_url: clip.videoUrl,
            target_timerange: {
              start: clip.startMs * 1000,
              duration: (clip.endMs - clip.startMs) * 1000,
            },
          })),
        },
        {
          id: 'track_audio_voice',
          type: 'audio',
          segments: params.timeline.voiceTrack.map((voice) => ({
            id: voice.id,
            source_url: voice.audioUrl,
            volume: voice.volume,
            target_timerange: {
              start: voice.startMs * 1000,
              duration: (voice.endMs - voice.startMs) * 1000,
            },
          })),
        },
        {
          id: 'track_subtitle',
          type: 'text',
          segments: params.timeline.subtitleTrack.map((sub) => ({
            id: sub.id,
            text: sub.text,
            target_timerange: {
              start: sub.startMs * 1000,
              duration: (sub.endMs - sub.startMs) * 1000,
            },
          })),
        },
      ],
      version: '6.0.0',
    };

    const draftInfoJson = JSON.stringify(draftInfo, null, 2);
    const draftContentJson = JSON.stringify(draftContent, null, 2);

    const draftInfoJsonPath = join(baseDir, 'draft_info.json');
    const draftContentJsonPath = join(baseDir, 'draft_content.json');

    await writeFile(draftInfoJsonPath, draftInfoJson, 'utf-8');
    await writeFile(draftContentJsonPath, draftContentJson, 'utf-8');

    return {
      exportId,
      timelineId: params.timeline.timelineId,
      projectPath: baseDir,
      draftInfoJsonPath,
      draftContentJsonPath,
      draftInfoJson,
      draftContentJson,
    };
  }
}
