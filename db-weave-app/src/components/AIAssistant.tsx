import { useState } from 'react'
import { Bot, Lightbulb, MessageSquare, Sparkles, Wand2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  generateSchemaFromPrompt,
  improveSchema,
  explainSchema,
  suggestImprovements,
} from '../api/ai'

interface AIAssistantProps {
  currentSchema: string
  onSchemaUpdate: (schema: string) => void
}

export function AIAssistant({ currentSchema, onSchemaUpdate }: AIAssistantProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')

  // Generate tab state
  const [generatePrompt, setGeneratePrompt] = useState('')
  const [includeExamples, setIncludeExamples] = useState(true)

  // Improve tab state
  const [improvementRequest, setImprovementRequest] = useState('')

  // Results state
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await generateSchemaFromPrompt({
        prompt: generatePrompt,
        includeExamples,
      })

      if (response.success && response.schema) {
        setResult(response.schema)
      } else {
        setError(response.error || 'Failed to generate schema')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleImprove = async () => {
    if (!currentSchema.trim() || !improvementRequest.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await improveSchema({
        currentSchema,
        improvements: improvementRequest,
      })

      if (response.success && response.schema) {
        setResult(response.schema)
      } else {
        setError(response.error || 'Failed to improve schema')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async () => {
    if (!currentSchema.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await explainSchema({
        schema: currentSchema,
      })

      if (response.success && response.explanation) {
        setResult(response.explanation)
      } else {
        setError(response.error || 'Failed to explain schema')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSuggest = async () => {
    if (!currentSchema.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await suggestImprovements({
        schema: currentSchema,
      })

      if (response.success && response.suggestions) {
        setResult(response.suggestions)
      } else {
        setError(response.error || 'Failed to get suggestions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUseResult = () => {
    if (result && (activeTab === 'generate' || activeTab === 'improve')) {
      onSchemaUpdate(result)
      setResult(null)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <p className="text-sm text-gray-600">
          Generate, improve, and understand your database schemas with AI
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 m-4 mb-0">
            <TabsTrigger value="generate" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="improve" className="text-xs">
              <Wand2 className="w-3 h-3 mr-1" />
              Improve
            </TabsTrigger>
            <TabsTrigger value="explain" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Explain
            </TabsTrigger>
            <TabsTrigger value="suggest" className="text-xs">
              <Lightbulb className="w-3 h-3 mr-1" />
              Suggest
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="generate" className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your database
                </label>
                <Textarea
                  placeholder="e.g., A blog system with users, posts, comments, and categories"
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeExamples"
                  checked={includeExamples}
                  onChange={(e) => setIncludeExamples(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="includeExamples" className="text-sm text-gray-700">
                  Include example data in comments
                </label>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !generatePrompt.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Schema
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="improve" className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How should I improve the current schema?
                </label>
                <Textarea
                  placeholder="e.g., Add indexes for better performance, normalize the user preferences, add audit fields"
                  value={improvementRequest}
                  onChange={(e) => setImprovementRequest(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleImprove}
                disabled={loading || !currentSchema.trim() || !improvementRequest.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Improve Schema
                  </>
                )}
              </Button>

              {!currentSchema.trim() && (
                <p className="text-xs text-gray-500">
                  Add some schema text to the editor first
                </p>
              )}
            </TabsContent>

            <TabsContent value="explain" className="p-4 space-y-4">
              <p className="text-sm text-gray-700">
                Get a detailed explanation of your current schema including table relationships,
                constraints, and design patterns.
              </p>

              <Button
                onClick={handleExplain}
                disabled={loading || !currentSchema.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Explain Schema
                  </>
                )}
              </Button>

              {!currentSchema.trim() && (
                <p className="text-xs text-gray-500">
                  Add some schema text to the editor first
                </p>
              )}
            </TabsContent>

            <TabsContent value="suggest" className="p-4 space-y-4">
              <p className="text-sm text-gray-700">
                Get specific suggestions for improving your schema's performance, security,
                and maintainability.
              </p>

              <Button
                onClick={handleSuggest}
                disabled={loading || !currentSchema.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Bot className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Get Suggestions
                  </>
                )}
              </Button>

              {!currentSchema.trim() && (
                <p className="text-xs text-gray-500">
                  Add some schema text to the editor first
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Results Section */}
      {(result || error) && (
        <div className="border-t p-4 bg-gray-50 max-h-80 overflow-auto">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="font-medium text-red-800 text-sm mb-1">Error</h4>
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 text-sm">Result</h4>
                {(activeTab === 'generate' || activeTab === 'improve') && (
                  <Button size="sm" onClick={handleUseResult}>
                    Use This Schema
                  </Button>
                )}
              </div>
              <div className="bg-white border rounded-md p-3">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono">
                  {result}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}