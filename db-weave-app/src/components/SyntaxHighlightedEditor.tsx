import React, { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

interface SyntaxHighlightedEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: { line: number; column: number; message: string } | null
}

// Define the language grammar for db-weave DSL
const KEYWORDS = ['table', 'enum']
const CONSTRAINTS = ['@pk', '@not_null', '@unique', '@fk', '@default', '@check']
const DATA_TYPES = [
  // Numeric
  'smallint', 'integer', 'bigint', 'serial', 'bigserial', 'smallserial',
  'decimal', 'numeric', 'real', 'double', 'money',
  // Text
  'text', 'varchar', 'char', 'citext',
  // Binary
  'bytea',
  // Boolean
  'boolean', 'bool',
  // Date/Time
  'date', 'time', 'timetz', 'timestamp', 'timestamptz', 'interval',
  // UUID
  'uuid',
  // JSON
  'json', 'jsonb',
  // Network
  'inet', 'cidr', 'macaddr', 'macaddr8',
  // Geometric
  'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle'
]
const FUNCTIONS = ['now']

export function SyntaxHighlightedEditor({
  value,
  onChange,
  placeholder,
  className,
  error
}: SyntaxHighlightedEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  // Tokenize the input text
  const tokenizeText = useCallback((text: string) => {
    const tokens: Array<{
      type: string
      text: string
      className: string
    }> = []

    const lines = text.split('\n')
    
    lines.forEach((line, lineIndex) => {
      let currentPos = 0
      
      while (currentPos < line.length) {
        // Check for comments
        if (line.slice(currentPos).startsWith('///')) {
          const comment = line.slice(currentPos)
          tokens.push({
            type: 'comment',
            text: comment,
            className: 'text-green-600 italic'
          })
          currentPos += comment.length
          continue
        }
        
        if (line.slice(currentPos).startsWith('//')) {
          const comment = line.slice(currentPos)
          tokens.push({
            type: 'comment',
            text: comment,
            className: 'text-green-600 italic'
          })
          currentPos += comment.length
          continue
        }

        // Check for constraint annotations
        let constraintMatch = false
        for (const constraint of CONSTRAINTS) {
          if (line.slice(currentPos).startsWith(constraint)) {
            tokens.push({
              type: 'constraint',
              text: constraint,
              className: 'text-purple-600 font-medium'
            })
            currentPos += constraint.length
            constraintMatch = true
            break
          }
        }
        if (constraintMatch) continue

        // Check for keywords
        let keywordMatch = false
        for (const keyword of KEYWORDS) {
          if (line.slice(currentPos).toLowerCase().startsWith(keyword)) {
            // Check if it's a whole word
            const nextChar = line[currentPos + keyword.length]
            if (!nextChar || !/[a-zA-Z0-9_]/.test(nextChar)) {
              tokens.push({
                type: 'keyword',
                text: keyword,
                className: 'text-blue-600 font-bold'
              })
              currentPos += keyword.length
              keywordMatch = true
              break
            }
          }
        }
        if (keywordMatch) continue

        // Check for data types
        let typeMatch = false
        for (const dataType of DATA_TYPES) {
          if (line.slice(currentPos).toLowerCase().startsWith(dataType)) {
            // Check if it's a whole word
            const nextChar = line[currentPos + dataType.length]
            if (!nextChar || !/[a-zA-Z0-9_]/.test(nextChar)) {
              tokens.push({
                type: 'datatype',
                text: dataType,
                className: 'text-orange-600 font-medium'
              })
              currentPos += dataType.length
              typeMatch = true
              break
            }
          }
        }
        if (typeMatch) continue

        // Check for functions
        let functionMatch = false
        for (const func of FUNCTIONS) {
          if (line.slice(currentPos).toLowerCase().startsWith(func)) {
            // Check if it's followed by parentheses
            if (line.slice(currentPos + func.length).startsWith('(')) {
              tokens.push({
                type: 'function',
                text: func,
                className: 'text-cyan-600 font-medium'
              })
              currentPos += func.length
              functionMatch = true
              break
            }
          }
        }
        if (functionMatch) continue

        // Check for string literals
        if (line[currentPos] === "'") {
          let strEnd = currentPos + 1
          while (strEnd < line.length && line[strEnd] !== "'") {
            strEnd++
            if (line[strEnd] === '\\' && strEnd + 1 < line.length) {
              strEnd += 2
            }
          }
          if (strEnd < line.length && line[strEnd] === "'") {
            strEnd++ // Include the closing quote
          }
          const stringLiteral = line.slice(currentPos, strEnd)
          tokens.push({
            type: 'string',
            text: stringLiteral,
            className: 'text-red-600'
          })
          currentPos = strEnd
          continue
        }

        // Check for numbers
        const numberMatch = line.slice(currentPos).match(/^-?\d+(\.\d+)?/)
        if (numberMatch) {
          tokens.push({
            type: 'number',
            text: numberMatch[0],
            className: 'text-blue-500'
          })
          currentPos += numberMatch[0].length
          continue
        }

        // Check for identifiers (table/column names)
        const identifierMatch = line.slice(currentPos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
        if (identifierMatch) {
          tokens.push({
            type: 'identifier',
            text: identifierMatch[0],
            className: 'text-gray-900'
          })
          currentPos += identifierMatch[0].length
          continue
        }

        // Add any remaining characters as text
        tokens.push({
          type: 'text',
          text: line[currentPos],
          className: 'text-gray-900'
        })
        currentPos++
      }

      // Add newline if not the last line
      if (lineIndex < lines.length - 1) {
        tokens.push({
          type: 'newline',
          text: '\n',
          className: ''
        })
      }
    })

    return tokens
  }, [])

  const tokens = tokenizeText(value)

  // Handle scroll synchronization
  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current
    const pre = preRef.current
    if (textarea && pre) {
      pre.scrollTop = textarea.scrollTop
      pre.scrollLeft = textarea.scrollLeft
    }
  }, [])

  // Handle textarea changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  // Focus and blur handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  // Set up scroll event listener
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll)
      return () => textarea.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return (
    <div className="relative font-mono text-sm">
      {/* Hidden textarea for input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none overflow-hidden caret-gray-900 bg-transparent",
          "border border-transparent",
          isFocused && "outline-none ring-2 ring-blue-500 ring-offset-2",
          error && "ring-2 ring-red-500 ring-offset-2",
          className
        )}
        style={{
          // Make textarea transparent so the highlighted content shows through
          color: 'transparent',
          caretColor: '#111827', // Gray-900 for caret
        }}
        spellCheck={false}
      />

      {/* Highlighted content overlay */}
      <pre
        ref={preRef}
        className={cn(
          "pointer-events-none p-4 overflow-hidden",
          "whitespace-pre-wrap break-words",
          !value && "text-gray-400"
        )}
        style={{
          minHeight: textareaRef.current?.scrollHeight || '100px',
          maxHeight: textareaRef.current?.scrollHeight || '100px',
        }}
      >
        {!value ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          tokens.map((token, index) => (
            <span
              key={index}
              className={token.className}
              data-token-type={token.type}
            >
              {token.text}
            </span>
          ))
        )}
      </pre>
    </div>
  )
}