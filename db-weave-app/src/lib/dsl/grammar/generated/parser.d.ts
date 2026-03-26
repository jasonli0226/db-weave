import type { SchemaNode } from '../../types'

export interface ParseOptions {
  grammarSource?: string
}

export function parse(input: string, options?: ParseOptions): SchemaNode
