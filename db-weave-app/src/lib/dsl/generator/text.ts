import type {
  ColumnConstraintNode,
  ColumnNode,
  DataTypeNode,
  DefaultExpression,
  EnumNode,
  IndexNode,
  SchemaNode,
  TableConstraintNode,
  TableNode,
} from '../types'

export interface TextGeneratorOptions {
  readonly includeComments?: boolean
  readonly indent?: string
}

const DEFAULT_OPTIONS: Required<TextGeneratorOptions> = {
  includeComments: true,
  indent: '  ',
}

export function generateText(
  schema: SchemaNode,
  options?: TextGeneratorOptions,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const parts: Array<string> = []

  // Generate enums first
  for (const enumNode of schema.enums) {
    parts.push(generateEnum(enumNode, opts))
  }

  // Generate tables
  for (const table of schema.tables) {
    parts.push(generateTable(table, opts))
  }

  return parts.join('\n\n')
}

function generateEnum(
  node: EnumNode,
  opts: Required<TextGeneratorOptions>,
): string {
  const lines: Array<string> = []

  if (opts.includeComments && node.description) {
    lines.push(`/// ${node.description}`)
  }

  lines.push(`enum ${node.name} {`)

  for (const value of node.values) {
    if (opts.includeComments && value.description) {
      lines.push(`${opts.indent}/// ${value.description}`)
    }
    lines.push(`${opts.indent}${value.name}`)
  }

  lines.push('}')

  return lines.join('\n')
}

function generateTable(
  node: TableNode,
  opts: Required<TextGeneratorOptions>,
): string {
  const lines: Array<string> = []

  if (opts.includeComments && node.description) {
    lines.push(`/// ${node.description}`)
  }

  lines.push(`table ${node.name} {`)

  // Generate columns
  for (const column of node.columns) {
    const columnText = generateColumn(column, opts)
    lines.push(
      ...columnText
        .split('\n')
        .map((line) => (line ? `${opts.indent}${line}` : '')),
    )
  }

  // Generate table-level constraints
  for (const constraint of node.constraints) {
    const constraintText = generateTableConstraint(constraint)
    lines.push(`${opts.indent}${constraintText}`)
  }

  // Generate indexes
  for (const index of node.indexes) {
    const indexText = generateIndex(index)
    lines.push(`${opts.indent}${indexText}`)
  }

  lines.push('}')

  return lines.join('\n')
}

function generateColumn(
  node: ColumnNode,
  opts: Required<TextGeneratorOptions>,
): string {
  const lines: Array<string> = []

  if (opts.includeComments && node.description) {
    lines.push(`/// ${node.description}`)
  }

  const parts: Array<string> = []
  parts.push(node.name)
  parts.push(generateDataType(node.dataType))

  // Add constraints
  for (const constraint of node.constraints) {
    const constraintText = generateColumnConstraint(constraint)
    if (constraintText) {
      parts.push(constraintText)
    }
  }

  lines.push(parts.join(' '))

  return lines.join('\n')
}

function generateDataType(node: DataTypeNode): string {
  let typeName = node.name

  // Handle parametrized types
  if (node.precision !== null && node.scale !== null) {
    typeName += `(${node.precision}, ${node.scale})`
  } else if (node.length !== null) {
    typeName += `(${node.length})`
  } else if (node.precision !== null) {
    typeName += `(${node.precision})`
  }

  // Handle arrays
  if (node.isArray) {
    typeName += '[]'.repeat(node.arrayDimensions)
  }

  return typeName
}

function generateColumnConstraint(node: ColumnConstraintNode): string | null {
  switch (node.kind) {
    case 'primary_key':
      return '@pk'

    case 'unique':
      return '@unique'

    case 'not_null':
      return '@not_null'

    case 'default':
      return `@default(${generateDefaultExpression(node.expression)})`

    case 'check':
      return `@check(${node.expression})`

    case 'foreign_key': {
      const parts = [`@fk(${node.references.table}.${node.references.column})`]

      if (node.onDelete) {
        parts.push(`@on_delete(${node.onDelete})`)
      }

      if (node.onUpdate) {
        parts.push(`@on_update(${node.onUpdate})`)
      }

      return parts.join(' ')
    }

    default:
      return null
  }
}

function generateDefaultExpression(expr: DefaultExpression): string {
  switch (expr.expressionType) {
    case 'literal':
      if (expr.dataType === 'string') {
        return `'${expr.value}'`
      }
      if (expr.dataType === 'null') {
        return 'null'
      }
      if (expr.dataType === 'boolean') {
        return expr.value ? 'true' : 'false'
      }
      return String(expr.value)

    case 'function': {
      const args = expr.args.map(generateDefaultExpression).join(', ')
      return `${expr.name}(${args})`
    }

    case 'raw':
      return expr.sql

    default:
      return 'null'
  }
}

function generateTableConstraint(node: TableConstraintNode): string {
  switch (node.kind) {
    case 'primary_key':
      if ('columns' in node) {
        return `@pk(${node.columns.join(', ')})`
      }
      return ''

    case 'unique':
      if ('columns' in node) {
        return `@unique(${node.columns.join(', ')})`
      }
      return ''

    case 'check':
      return `@check(${node.expression})`

    default:
      return ''
  }
}

function generateIndex(node: IndexNode): string {
  const columns = node.columns.join(', ')
  const unique = node.unique ? ' unique' : ''
  const method = node.method !== 'btree' ? ` using ${node.method}` : ''

  return `@index(${columns})${unique}${method}`
}
