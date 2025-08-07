import { MemoryConfig, MemoryConfigSchema } from '../types/schema.js';

export class MemoryConfigManager {
  static getConfig(): MemoryConfig {
    const config = {
      ollama: {
        baseUrl: process.env.OLLAMA_URL || 'http://ollama:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        embedModel: process.env.EMBED_MODEL || 'nomic-embed-text',
        temperature: 0.1
      },
      qdrant: {
        host: process.env.QDRANT_HOST || 'qdrant',
        port: parseInt(process.env.QDRANT_PORT || '6333'),
        collectionName: 'claude_code_memory'
      }
    };

    // Validate configuration
    return MemoryConfigSchema.parse(config);
  }
}