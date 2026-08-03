import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Service to automatically persist every pipeline step's JSON result into data/<campaignId>/
 */
export class JsonStorageService {
  private readonly baseDataDir: string;

  constructor(baseDir: string = join(process.cwd(), 'data')) {
    this.baseDataDir = baseDir;
  }

  /**
   * Saves a JSON result to data/<campaignId>/<stepFilename>.json
   * @param campaignId Unique identifier or slug for the campaign/URL
   * @param stepFilename e.g., '01_product_analysis.json' (extension .json will be added if missing)
   * @param data Any serializable JS/TS object or Zod-validated result
   * @returns The absolute file path where the JSON was saved
   */
  public async saveStepResult(campaignId: string, stepFilename: string, data: unknown): Promise<string> {
    const safeCampaignId = campaignId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const folderPath = join(this.baseDataDir, safeCampaignId);

    // Ensure the folder exists
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
}

export const jsonStorage = new JsonStorageService();
