import {
  type AIRequest,
  type AIResponse,
  type GenerateSchemaRequest,
  type ImproveSchemaRequest,
  type ExplainSchemaRequest,
  type SuggestImprovementsRequest,
} from '../types/api'

// Get API base URL from environment
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''
export const API_PREFIX = '/db-weave'

// Get Clerk token for authenticated requests
async function getAuthToken(): Promise<string | null> {
  // Clerk exposes window.Clerk after initialization
  const clerk = (window as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })
    .Clerk

  if (!clerk?.session) {
    return null
  }

  try {
    return await clerk.session.getToken()
  } catch {
    return null
  }
}

// Secure client-side function that calls your API
export async function callAI(request: AIRequest): Promise<AIResponse> {
  try {
    const token = await getAuthToken()

    if (!token) {
      return {
        success: false,
        error: 'Not authenticated. Please sign in to use AI features.',
      }
    }

    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/api/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })

    // Handle authentication errors
    if (response.status === 401) {
      return {
        success: false,
        error: 'Session expired. Please sign in again.',
      }
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      return {
        success: false,
        error: retryAfter
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Too many requests. Please wait before trying again.',
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        (errorData as { error?: string }).error || `AI API error: ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error('AI request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Wrapper functions for each AI feature with proper typing
export async function generateSchemaFromPrompt(data: GenerateSchemaRequest): Promise<AIResponse> {
  return callAI({ action: 'generate', data })
}

export async function improveSchema(data: ImproveSchemaRequest): Promise<AIResponse> {
  return callAI({ action: 'improve', data })
}

export async function explainSchema(data: ExplainSchemaRequest): Promise<AIResponse> {
  return callAI({ action: 'explain', data })
}

export async function suggestImprovements(data: SuggestImprovementsRequest): Promise<AIResponse> {
  return callAI({ action: 'suggest', data })
}
