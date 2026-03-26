import * as generatedParser from '../grammar/generated/parser.js'
import type { ParseResult, SchemaNode } from '../types'

export interface ParserOptions {
  readonly grammarSource?: string
}

export { sqlToAst } from './sql-to-ast'
export type { SqlToAstOptions, SqlToAstResult } from './sql-to-ast'

export function parse(input: string, options?: ParserOptions): ParseResult {
  try {
    const ast = generatedParser.parse(input, {
      grammarSource: options?.grammarSource ?? '<input>',
    })

    return {
      success: true,
      ast,
    }
  } catch (err) {
    if (isParseError(err)) {
      return {
        success: false,
        error: {
          message: err.message,
          location: err.location,
          expected:
            err.expected?.map(
              (e: Expected) => e.description ?? e.text ?? String(e),
            ) ?? [],
          found: err.found ?? null,
        },
      }
    }
    throw err
  }
}

interface Expected {
  description?: string
  text?: string
}

interface PeggyError extends Error {
  location: {
    start: { offset: number; line: number; column: number }
    end: { offset: number; line: number; column: number }
  }
  expected?: Array<Expected>
  found?: string | null
}

function isParseError(err: unknown): err is PeggyError {
  return (
    err !== null &&
    typeof err === 'object' &&
    'location' in err &&
    'message' in err
  )
}

export function parseOrThrow(
  input: string,
  options?: ParserOptions,
): SchemaNode {
  const result = parse(input, options)
  if (!result.success) {
    const { line, column } = result.error.location.start
    throw new Error(
      `Parse error at line ${line}, column ${column}: ${result.error.message}`,
    )
  }
  return result.ast
}
