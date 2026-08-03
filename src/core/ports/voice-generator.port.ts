/**
 * Vendor-Agnostic Port for AI Voiceover (TTS) and Sound Effects Generation
 * Implementations can wrap Gemini Audio, ElevenLabs, OpenAI TTS, etc.
 */
export interface VoiceGeneratorPort {
  generateVoiceover(params: {
    text: string;
    voicePersona: string;
    languageCode?: string;
  }): Promise<{
    audioUrl: string;
    durationMs: number;
    format: 'mp3' | 'wav';
  }>;

  generateSoundEffect(params: {
    description: string;
    durationMs?: number;
  }): Promise<{
    audioUrl: string;
    durationMs: number;
  }>;
}
