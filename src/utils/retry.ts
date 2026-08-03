import { mkdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  name?: string;
  logFile?: string;
}

/**
 * Retries an asynchronous function with exponential backoff and logs failures to data/logs/error.log
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelayMs = options?.initialDelayMs ?? 1000;
  const name = options?.name ?? 'Operation';
  const logDir = join(process.cwd(), 'data', 'logs');
  const logFile = options?.logFile ?? join(logDir, 'error.log');

  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMessage = err?.message || String(err);
      const timestamp = new Date().toISOString();

      const logEntry = `[${timestamp}] [ERROR] [${name}] [Attempt ${attempt}/${maxRetries}]: ${errorMessage}\n${err?.stack || ''}\n---\n`;

      try {
        await mkdir(logDir, { recursive: true });
        await appendFile(logFile, logEntry, 'utf-8');
      } catch (logErr) {
        console.error('Failed to write to error log:', logErr);
      }

      console.warn(`⚠️ [${name}] Attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);

      if (attempt < maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(`🔄 [${name}] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`[${name}] Failed after ${maxRetries} retries. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
