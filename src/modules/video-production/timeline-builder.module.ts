import {
  AdScriptResult,
  TimelineSpecification,
  TimelineSpecificationSchema,
} from '@types/intelligence-types';
import { VideoGeneratorPort } from '@core/ports/video-generator.port';
import { VoiceGeneratorPort } from '@core/ports/voice-generator.port';

/**
 * Timeline Builder Module: Synchronizes AI video clips, voiceover audio, background music,
 * and subtitles into a multitrack timeline JSON specification
 */
export class TimelineBuilderModule {
  constructor(
    private readonly videoGen: VideoGeneratorPort,
    private readonly voiceGen: VoiceGeneratorPort
  ) {}

  public async buildTimeline(
    script: AdScriptResult,
    aspectRatio: '9:16' | '16:9' | '1:1' = '9:16'
  ): Promise<TimelineSpecification> {
    const videoTrack = [];
    const voiceTrack = [];
    const subtitleTrack = [];

    let currentMs = 0;

    for (const scene of script.scenes) {
      const sceneDurationMs = scene.durationSeconds * 1000;
      const startMs = currentMs;
      const endMs = startMs + sceneDurationMs;

      // 1. Generate video clip via VideoGeneratorPort (e.g. Hailuo)
      const clipResult = await this.videoGen.generateVideoClip({
        prompt: scene.visualPrompt,
        durationSeconds: scene.durationSeconds,
        aspectRatio,
      });

      videoTrack.push({
        id: `vid_track_${scene.sceneNumber}`,
        sceneNumber: scene.sceneNumber,
        videoUrl: clipResult.videoUrl,
        startMs,
        endMs,
      });

      // 2. Generate voiceover audio via VoiceGeneratorPort (e.g. Gem)
      const voiceResult = await this.voiceGen.generateVoiceover({
        text: scene.voiceoverText,
        voicePersona: 'Korean_Confident_Young_Professional',
      });

      voiceTrack.push({
        id: `aud_track_${scene.sceneNumber}`,
        sceneNumber: scene.sceneNumber,
        audioUrl: voiceResult.audioUrl,
        startMs,
        endMs: startMs + Math.min(sceneDurationMs, voiceResult.durationMs),
        volume: 1.0,
      });

      // 3. Add subtitle track item
      subtitleTrack.push({
        id: `sub_track_${scene.sceneNumber}`,
        text: scene.onScreenCaption,
        startMs,
        endMs,
      });

      currentMs = endMs;
    }

    const rawData = {
      timelineId: `tl_${Date.now()}`,
      scriptId: script.scriptId,
      durationMs: currentMs,
      videoTrack,
      voiceTrack,
      bgmTrack: {
        audioUrl: 'https://assets.adforge.ai/audio/bgm/upbeat_trendy_reels_bgm.mp3',
        volume: 0.25, // Lower BGM volume so voiceover is clear
      },
      subtitleTrack,
    };

    return TimelineSpecificationSchema.parse(rawData);
  }
}
