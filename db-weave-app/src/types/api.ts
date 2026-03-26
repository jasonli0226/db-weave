// Shared types for AI API (copied from api-server)

export interface GenerateSchemaRequest {
  prompt: string
  includeExamples?: boolean
}

export interface ImproveSchemaRequest {
  currentSchema: string
  improvements: string
}

export interface ExplainSchemaRequest {
  schema: string
}

export interface SuggestImprovementsRequest {
  schema: string
}

export interface AIRequest {
  action: 'generate' | 'improve' | 'explain' | 'suggest'
  data: GenerateSchemaRequest | ImproveSchemaRequest | ExplainSchemaRequest | SuggestImprovementsRequest
}

export interface AIResponse {
  success: boolean
  schema?: string
  explanation?: string
  suggestions?: string
  error?: string
}

export interface HealthResponse {
  status: string
  timestamp: string
}