import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

/**
 * Service to automatically persist every pipeline step's JSON result into data/<campaignId>/
 * Upgraded for Sprint 3: Supports Schema-validated Resume, Metadata Headers, and LLM Debug Logging.
 */
export class JsonStorageService {
  private readonly baseDataDir: string;

  constructor(baseDir: string = join(process.cwd(), 'data')) {
    this.baseDataDir = baseDir;
  }

  /**
   * Saves a JSON result to data/<campaignId>/<stepFilename>.json
   */
  public async saveStepResult(campaignId: string, stepFilename: string, data: unknown): Promise<string> {
    const safeCampaignId = campaignId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const folderPath = join(this.baseDataDir, safeCampaignId);

    await mkdir(folderPath, { recursive: true });

    const filename = stepFilename.endsWith('.json') ? stepFilename : `${stepFilename}.json`;
    const filePath = join(folderPath, filename);

    const jsonContent = JSON.stringify(data, null, 2);
    await writeFile(filePath, jsonContent, 'utf-8');

    console.log(`💾 [Storage] Saved JSON step result -> ${filePath}`);
    return filePath;
  }

  /**
   * Loads a previously saved JSON step result
   */
  public async loadStepResult<T>(campaignId: string, stepFilename: string): Promise<T | null> {
    const safeCampaignId = campaignId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = stepFilename.endsWith('.json') ? stepFilename : `${stepFilename}.json`;
    const filePath = join(this.baseDataDir, safeCampaignId, filename);

    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  /**
   * Principle 9: Loads and validates an existing JSON file against a Zod schema.
   * If valid, resumes from it; if schema is broken/old, returns null so it auto-regenerates.
   */
  public async loadAndValidate<T>(
    campaignId: string,
    stepFilename: string,
    schema: z.ZodType<T>
  ): Promise<T | null> {
    const raw = await this.loadStepResult<unknown>(campaignId, stepFilename);
    if (!raw) return null;

    const result = schema.safeParse(raw);
    if (result.success) {
      console.log(`♻️ [Storage] Resumed schema-verified JSON -> ${stepFilename}`);
      return result.data;
    } else {
      console.warn(
        `⚠️ [Storage] Existing JSON failed schema validation for ${stepFilename}. Auto-regenerating...`
      );
      return null;
     }
  }

  /**
   * Principle 8: Wraps payload with unified metadata header ({ meta: { ... }, data: { ... } })
   */
  public wrapWithMeta<T>(
    data: T,
    campaignId: string,
    sourceUrl?: string,
    schemaVersion: string = '1.0'
  ) {
    return {
      meta: {
        schemaVersion,
        pipelineVersion: 'Sprint3',
        generatedAt: new Date().toISOString(),
        generatorVersion: 'AdForge v2',
        campaignId,
        sourceUrl,
      },
      data,
    };
  }

  /**
   * Principle 7: Saves LLM Prompt, Response, Token usage, and Latency to data/debug/<campaignId>/<moduleName>/
   */
  public async saveDebugLogs(
    campaignId: string,
    moduleName: string,
    logs: {
      prompt?: string;
      response?: string;
      tokens?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
      latencyMs?: number;
    }
  ): Promise<void> {
    const safeCampaignId = campaignId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const debugDir = join(this.baseDataDir, 'debug', safeCampaignId, moduleName);
    await mkdir(debugDir, { recursive: true });

    if (logs.prompt) {
      await writeFile(join(debugDir, 'prompt.md'), logs.prompt, 'utf-8');
    }
    if (logs.response) {
      await writeFile(join(debugDir, 'response.md'), logs.response, 'utf-8');
    }
    if (logs.tokens) {
      await writeFile(join(debugDir, 'tokens.json'), JSON.stringify(logs.tokens, null, 2), 'utf-8');
    }
    if (logs.latencyMs !== undefined) {
      await writeFile(join(debugDir, 'latency.json'), JSON.stringify({ latencyMs: logs.latencyMs }, null, 2), 'utf-8');
    }
  }
}

export const jsonStorage = new JsonStorageService();
