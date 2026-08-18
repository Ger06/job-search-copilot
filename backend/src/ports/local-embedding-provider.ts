import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import type { EmbeddingProvider } from "./embedding-provider.js";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

export class LocalEmbeddingProvider implements EmbeddingProvider {
  private pipelinePromise: Promise<FeatureExtractionPipeline> | undefined;

  private getPipeline(): Promise<FeatureExtractionPipeline> {
    if (this.pipelinePromise === undefined) {
      this.pipelinePromise = pipeline("feature-extraction", MODEL_NAME);
    }
    return this.pipelinePromise;
  }

  async embed(text: string): Promise<number[]> {
    const extractor = await this.getPipeline();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data as Float32Array);
  }
}
