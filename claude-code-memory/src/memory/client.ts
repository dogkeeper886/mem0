import axios, { AxiosInstance } from 'axios';
import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'crypto';
import { Memory, SearchResult, MemoryConfig } from '../types/schema.js';

export class MemoryClient {
  private qdrant: QdrantClient;
  private ollama: AxiosInstance;
  private config: MemoryConfig;
  private initialized = false;

  constructor(config: MemoryConfig) {
    this.config = config;
    this.qdrant = new QdrantClient({
      url: `http://${config.qdrant.host}:${config.qdrant.port}`,
    });
    this.ollama = axios.create({
      baseURL: config.ollama.baseUrl,
      timeout: 30000
    });
  }

  private log(level: string, message: string, extra?: any): void {
    const timestamp = new Date().toISOString();
    const extraStr = extra ? ` | ${JSON.stringify(extra)}` : '';
    console.error(`${timestamp} - MemoryClient - ${level.toUpperCase()} - ${message}${extraStr}`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.log('info', 'Initializing connections...', { 
        ollama: this.config.ollama.baseUrl, 
        qdrant: `${this.config.qdrant.host}:${this.config.qdrant.port}` 
      });
      
      // Test Ollama connection
      this.log('info', 'Testing Ollama connection...');
      await this.ollama.get('/api/tags');
      this.log('info', '✓ Ollama connection successful');
      
      // Test Qdrant connection
      this.log('info', 'Testing Qdrant connection...');
      await this.qdrant.getCollections();
      this.log('info', '✓ Qdrant connection successful');
      
      // Create collection if it doesn't exist
      try {
        await this.qdrant.getCollection(this.config.qdrant.collectionName);
      } catch (e) {
        this.log('info', `Creating collection: ${this.config.qdrant.collectionName}`);
        await this.qdrant.createCollection(this.config.qdrant.collectionName, {
          vectors: {
            size: 768, // nomic-embed-text dimension
            distance: 'Cosine'
          }
        });
      }

      this.initialized = true;
      this.log('info', '✓ Memory client initialized');
    } catch (error) {
      const err = error as Error;
      this.log('error', 'Failed to initialize memory client', { error: err.message, stack: err.stack });
      throw error;
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.post('/api/embeddings', {
        model: this.config.ollama.embedModel,
        prompt: text
      });
      return response.data.embedding;
    } catch (error) {
      const err = error as Error;
      this.log('error', `Failed to get embedding: ${err.message}`);
      throw error;
    }
  }

  async addMemory(messages: string[], userId = 'default', metadata: Record<string, any> = {}): Promise<Memory[]> {
    await this.initialize();
    
    try {
      const memories: Memory[] = [];
      
      for (const message of messages) {
        const content = typeof message === 'string' ? message : JSON.stringify(message);
        const embedding = await this.getEmbedding(content);
        
        const memoryId = randomUUID();
        const createdAt = new Date().toISOString();
        const point = {
          id: memoryId,
          vector: embedding,
          payload: {
            content,
            user_id: userId,
            created_at: createdAt,
            ...metadata
          }
        };

        await this.qdrant.upsert(this.config.qdrant.collectionName, {
          points: [point]
        });

        memories.push({
          id: memoryId,
          content,
          user_id: userId,
          created_at: createdAt,
          metadata: { ...metadata }
        });
      }

      return memories;
    } catch (error) {
      const err = error as Error;
      this.log('error', `Failed to add memory: ${err.message}`);
      throw error;
    }
  }

  async searchMemory(query: string, userId = 'default', limit = 5): Promise<SearchResult[]> {
    await this.initialize();
    
    try {
      const queryEmbedding = await this.getEmbedding(query);
      
      const searchResult = await this.qdrant.search(this.config.qdrant.collectionName, {
        vector: queryEmbedding,
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        },
        limit,
        with_payload: true
      });

      return searchResult.map(point => ({
        id: point.id.toString(),
        content: point.payload?.content as string,
        score: point.score || 0,
        user_id: point.payload?.user_id as string,
        created_at: point.payload?.created_at as string,
        metadata: { ...point.payload }
      }));
    } catch (error) {
      const err = error as Error;
      this.log('error', `Failed to search memory: ${err.message}`);
      throw error;
    }
  }

  async getAllMemories(userId = 'default'): Promise<Memory[]> {
    await this.initialize();
    
    try {
      const scrollResult = await this.qdrant.scroll(this.config.qdrant.collectionName, {
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        },
        with_payload: true,
        limit: 100
      });

      return scrollResult.points.map(point => ({
        id: point.id.toString(),
        content: point.payload?.content as string,
        user_id: point.payload?.user_id as string,
        created_at: point.payload?.created_at as string,
        metadata: { ...point.payload }
      }));
    } catch (error) {
      const err = error as Error;
      this.log('error', `Failed to get all memories: ${err.message}`);
      throw error;
    }
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await this.initialize();
    
    try {
      await this.qdrant.delete(this.config.qdrant.collectionName, {
        points: [memoryId]
      });
      this.log('info', `Deleted memory: ${memoryId}`);
    } catch (error) {
      const err = error as Error;
      this.log('error', `Failed to delete memory: ${err.message}`);
      throw error;
    }
  }

  async resetMemory(userId = 'default'): Promise<void> {
    await this.initialize();
    
    try {
      await this.qdrant.delete(this.config.qdrant.collectionName, {
        filter: {
          must: [
            {
              key: 'user_id',
              match: { value: userId }
            }
          ]
        }
      });
      this.log('info', `Reset all memories for user: ${userId}`);
    } catch (error) {
      const err = error as Error;
      this.log('error', `Failed to reset memory: ${err.message}`);
      throw error;
    }
  }
}