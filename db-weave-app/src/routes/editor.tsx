import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from '../lib/useLocalStorage'
import { Bot, Code, Copy, Download, Eye, Upload, Zap, ZapOff } from 'lucide-react'
import { ReactFlowProvider } from '@xyflow/react'
import { useAuth } from '@clerk/clerk-react'
import {
  ResizableGroup,
  ResizableHandle,
  ResizablePanel,
} from '../components/ui/resizable'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { DbWeaveMonacoEditor } from '../components/MonacoEditor'
import { Button } from '../components/ui/button'
import { ERDRenderer } from '../components/ERDRenderer'
import { ERDExportButton } from '../components/ERDExportButton'
import { ImportSQLModal } from '../components/ImportSQLModal'
import { AIAssistant } from '../components/AIAssistant'
import { ORMIntegration } from '../components/orm/ORMIntegration'
import { parse, sqlToAst } from '../lib/dsl/parser'
import { generateSql, generateText } from '../lib/dsl/generator'
import type { ParseError, SchemaNode } from '../lib/dsl/types'

export const Route = createFileRoute('/editor')({
  component: ProtectedEditor,
})

function ProtectedEditor() {
  const { isSignedIn, isLoaded } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate({ to: '/login' })
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return <Editor />
}

type PreviewMode = 'erd' | 'sql' | 'orm'

function Editor() {
  const [schemaText, setSchemaText] = useLocalStorage('db-weave-schema-text', `// Example Database Schema
/// Users table stores user account information
table users {
  id integer @pk
  name varchar(100) @not_null
  email varchar(255) @unique @not_null
  created_at timestamp @default(now())
}

/// Posts table stores blog posts
table posts {
  id integer @pk
  title varchar(255) @not_null
  content text
  user_id integer @fk(users.id) @not_null
  created_at timestamp @default(now())
}`)
  const [parsedSchema, setParsedSchema] = useState<SchemaNode | null>(null)
  const [parseError, setParseError] = useState<ParseError | null>(null)
  const [generatedSql, setGeneratedSql] = useState<string>('')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('erd')
  const [livePreview, setLivePreview] = useState(true)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [aiAssistantModalOpen, setAiAssistantModalOpen] = useState(false)

  const handleGenerate = useCallback(() => {
    if (!schemaText.trim()) {
      setParsedSchema(null)
      setParseError(null)
      setGeneratedSql('')
      return
    }

    const result = parse(schemaText)
    if (result.success) {
      setParsedSchema(result.ast)
      setParseError(null)

      // Generate SQL automatically
      const sql = generateSql(result.ast, {
        includeComments: true,
        includeDropStatements: false,
      })
      setGeneratedSql(sql)
    } else {
      setParsedSchema(null)
      setParseError(result.error)
      setGeneratedSql('')
    }
  }, [schemaText])

  // Debounced auto-generation for live preview
  useEffect(() => {
    if (!livePreview) return

    const timeoutId = setTimeout(() => {
      handleGenerate()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [schemaText, livePreview, handleGenerate])

  const handleImportSQL = useCallback((sqlInput: string) => {
    const result = sqlToAst(sqlInput)
    if (result.success && result.ast) {
      setParsedSchema(result.ast)
      setParseError(null)

      // Generate text from AST
      const text = generateText(result.ast, {
        includeComments: true,
      })
      setSchemaText(text)

      // Also generate SQL for consistency
      const sql = generateSql(result.ast, {
        includeComments: true,
        includeDropStatements: false,
      })
      setGeneratedSql(sql)
    } else {
      throw new Error(result.error || 'Unknown error parsing SQL')
    }
  }, [])

  const handleCopyToClipboard = async () => {
    if (!generatedSql) return

    try {
      await navigator.clipboard.writeText(generatedSql)
      // TODO: Add toast notification
    } catch (err) {
      // Error handled silently
    }
  }

  const handleDownloadSql = () => {
    if (!generatedSql) return

    const blob = new Blob([generatedSql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'schema.sql'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Database Schema Editor</h1>
            <p className="text-sm text-gray-600">
              Design your database schema and visualize it
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <Button
              variant={livePreview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLivePreview(!livePreview)}
              title={livePreview ? 'Live Preview: On' : 'Live Preview: Off'}
            >
              {livePreview ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Live
                </>
              ) : (
                <>
                  <ZapOff className="w-4 h-4 mr-2" />
                  Manual
                </>
              )}
            </Button>

            <div className="h-6 w-px bg-gray-300" />

            <Button
              variant={previewMode === 'erd' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('erd')}
              disabled={!parsedSchema}
            >
              <Eye className="w-4 h-4 mr-2" />
              ERD
            </Button>

            <Button
              variant={previewMode === 'sql' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('sql')}
              disabled={!generatedSql}
            >
              <Code className="w-4 h-4 mr-2" />
              SQL
            </Button>

            <Button
              variant={previewMode === 'orm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('orm')}
              disabled={!schemaText}
            >
              <Bot className="w-4 h-4 mr-2" />
              ORM
            </Button>

            <div className="h-6 w-px bg-gray-300" />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiAssistantModalOpen(true)}
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import SQL
            </Button>

            {parsedSchema && previewMode === 'erd' && <ERDExportButton />}

            {generatedSql && previewMode === 'sql' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadSql}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Split-Pane Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizableGroup orientation="horizontal">
          {/* Left Panel - Text Editor */}
          <ResizablePanel defaultSize={45} minSize={25}>
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">
                  Schema Text
                </h2>
                {!livePreview && (
                  <Button variant="outline" size="sm" onClick={handleGenerate}>
                    Generate
                  </Button>
                )}
              </div>

              <DbWeaveMonacoEditor
                value={schemaText}
                onChange={setSchemaText}
                placeholder="Enter your database schema in text format..."
                className="flex-1"
                error={parseError ? {
                  line: parseError.location?.start.line || 1,
                  column: parseError.location?.start.column || 1,
                  message: parseError.message
                } : null}
              />

              {parseError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-red-800 font-semibold text-sm mb-1">
                    Parse Error
                  </h3>
                  <p className="text-red-700 text-xs">{parseError.message}</p>
                  {parseError.location && (
                    <p className="text-red-600 text-xs mt-1">
                      Line {parseError.location.start.line}, Column{' '}
                      {parseError.location.start.column}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Resize Handle */}
          <ResizableHandle
            withHandle
            className="w-2 bg-gray-200 hover:bg-blue-500 transition-colors"
          />

          {/* Middle Panel - Preview */}
          <ResizablePanel defaultSize={55} minSize={25}>
            <div className="h-full flex flex-col bg-gray-50">
              {/* Preview Content */}
              {previewMode === 'erd' ? (
                parsedSchema ? (
                  <ERDRenderer schema={parsedSchema} />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Start typing to see your ERD diagram</p>
                      {!livePreview && (
                        <p className="text-sm mt-1">
                          Click "Generate" to update the preview
                        </p>
                      )}
                    </div>
                  </div>
                )
              ) : previewMode === 'sql' ? (
                <div className="h-full overflow-auto p-4">
                  {generatedSql ? (
                    <pre className="font-mono text-sm whitespace-pre-wrap bg-white p-4 rounded-md border">
                      {generatedSql}
                    </pre>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Start typing to generate SQL</p>
                        {!livePreview && (
                          <p className="text-sm mt-1">
                            Click "Generate" to update the SQL
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-auto p-4">
                  <ORMIntegration dbWeaveText={schemaText} />
                </div>
              )}
            </div>
          </ResizablePanel>

        </ResizableGroup>
      </div>

      {/* Import SQL Modal */}
      <ImportSQLModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImport={handleImportSQL}
      />

      {/* AI Assistant Modal */}
      <Dialog open={aiAssistantModalOpen} onOpenChange={setAiAssistantModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              AI Assistant
            </DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-hidden">
            <AIAssistant
              currentSchema={schemaText}
              onSchemaUpdate={setSchemaText}
            />
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </ReactFlowProvider>
  )
}
