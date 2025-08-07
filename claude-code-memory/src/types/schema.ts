import { z } from 'zod';

// Memory-related schemas
export const AddMemorySchema = z.object({
  messages: z.array(z.string()).min(1, "At least one message is required"),
  user_id: z.string().optional().default('default'),
  metadata: z.record(z.any()).optional().default({})
});

export const SearchMemorySchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  user_id: z.string().optional().default('default'),
  limit: z.number().int().positive().max(50).optional().default(5)
});

export const ListMemoriesSchema = z.object({
  user_id: z.string().optional().default('default')
});

export const DeleteMemorySchema = z.object({
  memory_id: z.string().min(1, "Memory ID cannot be empty")
});

export const ResetMemorySchema = z.object({
  user_id: z.string().optional().default('default')
});

// Configuration schemas
export const OllamaConfigSchema = z.object({
  baseUrl: z.string().url(),
  model: z.string(),
  embedModel: z.string(),
  temperature: z.number().min(0).max(2).optional().default(0.1)
});

export const QdrantConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  collectionName: z.string()
});

export const MemoryConfigSchema = z.object({
  ollama: OllamaConfigSchema,
  qdrant: QdrantConfigSchema
});

// Memory types
export interface Memory {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface SearchResult extends Memory {
  score: number;
}

// Type exports for tool parameters
export type AddMemoryParams = z.infer<typeof AddMemorySchema>;
export type SearchMemoryParams = z.infer<typeof SearchMemorySchema>;
export type ListMemoriesParams = z.infer<typeof ListMemoriesSchema>;
export type DeleteMemoryParams = z.infer<typeof DeleteMemorySchema>;
export type ResetMemoryParams = z.infer<typeof ResetMemorySchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;