import { LocalEmbeddingProvider } from "../src/ports/local-embedding-provider.js";

await new LocalEmbeddingProvider().embed("warmup");
console.log("Modelo de embeddings descargado y cacheado para el build.");
