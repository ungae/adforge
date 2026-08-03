/**
 * ReviewEmbeddingPort
 * Interface designed for future vector search across review intelligence datasets.
 * Actual embedding implementation will be added in Sprint 3+.
 */
export interface ReviewEmbeddingPort {
  generateEmbedding(text: string): Promise<number[]>;
  searchSimilarReviews(query: string, topK?: number): Promise<any[]>;
}
