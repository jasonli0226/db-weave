import React, { useState, useCallback, useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

// Configure Monaco loader
loader.config({ monaco })

// Define db-weave language configuration
const DB_WEAVE_LANGUAGE: monaco.languages.ILanguageExtensionPoint = {
  id: 'db-weave',
  extensions: ['.dbw', '.dsl'],
  aliases: ['db-weave', 'DB Weave', 'Database Weave'],
  mimetypes: ['text/x-db-weave'],
}

// Keywords and tokens for db-weave
const KEYWORDS = ['table', 'enum']
const CONSTRAINTS = ['@pk', '@not_null', '@unique', '@fk', '@default', '@check']
const DATA_TYPES = [
  // Numeric
  'smallint',
  'integer',
  'bigint',
  'serial',
  'bigserial',
  'smallserial',
  'decimal',
  'numeric',
  'real',
  'double',
  'money',
  // Text
  'text',
  'varchar',
  'char',
  'citext',
  // Binary
  'bytea',
  // Boolean
  'boolean',
  'bool',
  // Date/Time
  'date',
  'time',
  'timetz',
  'timestamp',
  'timestamptz',
  'interval',
  // UUID
  'uuid',
  // JSON
  'json',
  'jsonb',
  // Network
  'inet',
  'cidr',
  'macaddr',
  'macaddr8',
  // Geometric
  'point',
  'line',
  'lseg',
  'box',
  'path',
  'polygon',
  'circle',
]
const FUNCTIONS = ['now']

// Configure db-weave language
export function configureDbWeaveLanguage() {
  // Register the language
  monaco.languages.register(DB_WEAVE_LANGUAGE)

  // Configure language features
  monaco.languages.setMonarchTokensProvider('db-weave', {
    tokenizer: {
      root: [
        // Comments
        [/(\/\/.*$)/, 'comment'],
        [/(\/\/\/.*$)/, 'comment.doc'],

        // Keywords
        [/\b(table|enum)\b/, 'keyword'],

        // Constraints
        [/@(pk|not_null|unique|fk|default|check)\b/, 'annotation'],

        // Data types
        [new RegExp(`\\b(${DATA_TYPES.join('|')})\\b`), 'type'],

        // Functions
        [/\b(now)\b(?=\()/, 'function'],

        // Numbers
        [/\b\d+(\.\d+)?\b/, 'number'],

        // String literals
        [/'[^']*'/, 'string'],
        [/"[^"]*"/, 'string'],

        // Identifiers (table/column names)
        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
      ],
    },
  })

  // Configure completion items
  monaco.languages.registerCompletionItemProvider('db-weave', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      }

      const suggestions: monaco.languages.CompletionItem[] = []

      // Add keywords
      KEYWORDS.forEach((keyword) => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
          detail: `${keyword} keyword`,
          documentation: `${keyword} definition`,
        })
      })

      // Add constraints
      CONSTRAINTS.forEach((constraint) => {
        suggestions.push({
          label: constraint,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: constraint,
          range,
          detail: `${constraint} constraint`,
          documentation: `Database constraint: ${constraint}`,
        })
      })

      // Add data types
      DATA_TYPES.forEach((type) => {
        suggestions.push({
          label: type,
          kind: monaco.languages.CompletionItemKind.TypeParameter,
          insertText: type,
          range,
          detail: `${type} data type`,
          documentation: `PostgreSQL data type: ${type}`,
        })
      })

      // Add functions
      FUNCTIONS.forEach((func) => {
        suggestions.push({
          label: func,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: `${func}()`,
          range,
          detail: `${func} function`,
          documentation: `Database function: ${func}`,
        })
      })

      return { suggestions }
    },
  })

  // Configure hover provider
  monaco.languages.registerHoverProvider('db-weave', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position)
      if (!word) return null

      const wordLower = word.word.toLowerCase()

      // Check for constraints
      if (CONSTRAINTS.includes(`@${wordLower}`)) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `**@${wordLower}**` },
            { value: `Database constraint marker: ${wordLower}` },
          ],
        }
      }

      // Check for data types
      if (DATA_TYPES.includes(wordLower)) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `**${wordLower}**` },
            { value: `PostgreSQL data type: ${wordLower}` },
          ],
        }
      }

      // Check for keywords
      if (KEYWORDS.includes(wordLower)) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn,
          ),
          contents: [
            { value: `**${wordLower}**` },
            { value: `db-weave keyword: ${wordLower}` },
          ],
        }
      }

      return null
    },
  })
}

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: { line: number; column: number; message: string } | null
}

// Dynamic import for Monaco Editor
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'))

export function DbWeaveMonacoEditor({
  value,
  onChange,
  className,
  error,
}: MonacoEditorProps) {
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    // Configure the db-weave language when Monaco is loaded
    if (isEditorReady) {
      configureDbWeaveLanguage()
    }
  }, [isEditorReady])

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor
      setIsEditorReady(true)

      // Configure editor options
      editor.updateOptions({
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        lineNumbers: 'on',
        roundedSelection: false,
        occurrencesHighlight: 'off',
        cursorBlinking: 'blink',
        automaticLayout: true,
        theme: 'vs',
        wordWrap: 'on',
        folding: true,
        showFoldingControls: 'always',
        bracketPairColorization: {
          enabled: true,
        },
      })

      // Add error markers if present
      if (error) {
        const model = editor.getModel()
        if (model) {
          monaco.editor.setModelMarkers(model, 'db-weave', [
            {
              startLineNumber: error.line,
              startColumn: error.column,
              endLineNumber: error.line,
              endColumn: error.column + 1,
              message: error.message,
              severity: monaco.MarkerSeverity.Error,
            },
          ])
        }
      }
    },
    [error],
  )

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onChange(value || '')
    },
    [onChange],
  )

  return (
    <div className={`relative min-h-0 overflow-hidden ${className || ''}`}>
      <React.Suspense
        fallback={<div className="h-full bg-gray-100 animate-pulse" />}
      >
        <MonacoEditor
          height="100%"
          defaultLanguage="db-weave"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="h-full bg-gray-100 animate-pulse flex items-center justify-center">
              <span className="text-gray-500">Loading editor...</span>
            </div>
          }
          options={{
            value,
            language: 'db-weave',
            theme: 'vs',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            occurrencesHighlight: 'off',
            cursorBlinking: 'blink',
            automaticLayout: true,
            wordWrap: 'on',
            folding: true,
            showFoldingControls: 'always',
            bracketPairColorization: { enabled: true },
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            autoIndent: 'advanced',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </React.Suspense>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-semibold text-sm mb-1">
            Parse Error
          </h3>
          <p className="text-red-700 text-xs">{error.message}</p>
          <p className="text-red-600 text-xs mt-1">
            Line {error.line}, Column {error.column}
          </p>
        </div>
      )}
    </div>
  )
}
