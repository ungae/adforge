import { VoiceGeneratorPort } from '@core/ports/voice-generator.port';

/**
 * Gem / Gemini Audio Adapter for AI Voiceover (TTS) and SFX
 */
export class GemAudioAdapter implements VoiceGeneratorPort {
  public async generateVoiceover(params: {
    text: string;
    voicePersona: string;
    languageCode?: string;
  }): Promise<{ audioUrl: string; durationMs: number; format: 'mp3' | 'wav' }> {
    const slug = params.voicePersona.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const estimatedDurationMs = Math.max(2000, params.text.length * 150); // ~150ms per Korean character
    const audioUrl = `https://assets.adforge.ai/audio/gem/${slug}_${Date.now()}.mp3`;

    return {
      audioUrl,
      durationMs: estimatedDurationMs,
      format: 'mp3',
    };
  }

  public async generateSoundEffect(params: {
    description: string;
    durationMs?: number;
  }): Promise<{ audioUrl: string; durationMs: number }> {
    const durationMs = params.durationMs || 2500;
    const audioUrl = `https://assets.adforge.ai/audio/sfx/gem_sfx_${Date.now()}.mp3`;

    return {
      audioUrl,
      durationMs,
    };
  }
}
