import { z } from 'zod';

/**
 * Zod schema for environment variables
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LLM_PROVIDER: z.enum(['openai', 'gemini', 'anthropic', 'mock']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEFAULT_LANGUAGE: z.string().default('ko-KR'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadEnvConfig(): EnvConfig {
  const parseResult = envSchema.safeParse(process.env);
  if (!parseResult.success) {
    console.warn('⚠️ Some environment variables were invalid or missing. Falling back to defaults.');
    return envSchema.parse({});
  }
  return parseResult.data;
}

export const env = loadEnvConfig();
