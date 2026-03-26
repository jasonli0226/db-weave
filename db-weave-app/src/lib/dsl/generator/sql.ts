import type {
  ColumnConstraintNode,
  ColumnNode,
  DataTypeNode,
  DefaultExpression,
  EnumNode,
  ForeignKeyAction,
  IndexNode,
  SchemaNode,
  TableConstraintNode,
  TableNode,
} from '../types'

export interface SqlGeneratorOptions {
  readonly includeComments?: boolean
  readonly includeDropStatements?: boolean
  readonly schemaName?: string
  readonly indent?: string
}

const DEFAULT_OPTIONS: Required<SqlGeneratorOptions> = {
  includeComments: true,
  includeDropStatements: false,
  schemaName: '',
  indent: '  ',
}

export function generateSql(
  schema: SchemaNode,
  options?: SqlGeneratorOptions,
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const parts: Array<string> = []

  // Generate enums first (tables may reference them)
  for (const enumNode of schema.enums) {
    parts.push(generateEnum(enumNode, opts))
  }

  // Generate tables
  for (const table of schema.tables) {
    parts.push(generateTable(table, opts))
  }

  // Generate indexes (after tables)
  for (const table of schema.tables) {
    const indexSql = generateIndexes(table, opts)
    if (indexSql) {
      parts.push(indexSql)
    }
  }

  return parts.join('\n\n')
}

function generateEnum(
  node: EnumNode,
  opts: Required<SqlGeneratorOptions>,
): string {
  const lines: Array<string> = []
  const qualifiedName = qualifyName(node.name, opts.schemaName)

  if (opts.includeComments && node.description) {
    lines.push(`-- ${node.description}`)
  }

  if (opts.includeDropStatements) {
    lines.push(`DROP TYPE IF EXISTS ${qualifiedName} CASCADE;`)
  }

  const values = node.values
    .map((v) => `'${escapeSqlString(v.name)}'`)
    .join(', ')
  lines.push(`CREATE TYPE ${qualifiedName} AS ENUM (${values});`)

  // Add comments for enum values
  if (opts.includeComments) {
    for (const value of node.values) {
      if (value.description) {
        lines.push(
          `COMMENT ON TYPE ${qualifiedName} IS '${escapeSqlString(value.description)}';`,
        )
        break // PostgreSQL only supports one comment per type
      }
    }
  }

  return lines.join('\n')
}

function generateTable(
  node: TableNode,
  opts: Required<SqlGeneratorOptions>,
): string {
  const lines: Array<string> = []
  const qualifiedName = qualifyName(node.name, opts.schemaName)

  if (opts.includeComments && node.description) {
    lines.push(`-- ${node.description}`)
  }

  if (opts.includeDropStatements) {
    lines.push(`DROP TABLE IF EXISTS ${qualifiedName} CASCADE;`)
  }

  lines.push(`CREATE TABLE ${qualifiedName} (`)

  const columnDefs: Array<string> = []

  // Generate columns
  for (const column of node.columns) {
    columnDefs.push(generateColumn(column, opts))
  }

  // Generate table-level constraints
  for (const constraint of node.constraints) {
    columnDefs.push(generateTableConstraint(constraint, opts))
  }

  lines.push(columnDefs.map((def) => opts.indent + def).join(',\n'))
  lines.push(');')

  // Add column comments
  if (opts.includeComments) {
    for (const column of node.columns) {
      if (column.description) {
        lines.push(
          `COMMENT ON COLUMN ${qualifiedName}.${escapeIdentifier(column.name)} IS '${escapeSqlString(column.description)}';`,
        )
      }
    }

    // Add table comment
    if (node.description) {
      lines.push(
        `COMMENT ON TABLE ${qualifiedName} IS '${escapeSqlString(node.description)}';`,
      )
    }
  }

  return lines.join('\n')
}

function generateColumn(
  node: ColumnNode,
  _opts: Required<SqlGeneratorOptions>,
): string {
  const parts: Array<string> = []

  parts.push(escapeIdentifier(node.name))
  parts.push(generateDataType(node.dataType))

  // Collect constraints
  const constraintParts: Array<string> = []

  for (const constraint of node.constraints) {
    const sql = generateColumnConstraint(constraint)
    if (sql) {
      constraintParts.push(sql)
    }
  }

  if (constraintParts.length > 0) {
    parts.push(constraintParts.join(' '))
  }

  return parts.join(' ')
}

function generateDataType(node: DataTypeNode): string {
  let typeName = mapDataTypeName(node.name)

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

function mapDataTypeName(name: string): string {
  const mappings: Record<string, string> = {
    int: 'INTEGER',
    bool: 'BOOLEAN',
    double: 'DOUBLE PRECISION',
    timestamptz: 'TIMESTAMP WITH TIME ZONE',
    timetz: 'TIME WITH TIME ZONE',
  }

  return mappings[name.toLowerCase()] ?? name.toUpperCase()
}

function generateColumnConstraint(node: ColumnConstraintNode): string | null {
  switch (node.kind) {
    case 'primary_key':
      return 'PRIMARY KEY'

    case 'unique':
      return 'UNIQUE'

    case 'not_null':
      return 'NOT NULL'

    case 'default':
      return `DEFAULT ${generateDefaultExpression(node.expression)}`

    case 'check':
      return `CHECK (${node.expression})`

    case 'foreign_key':
      let fk = `REFERENCES ${escapeIdentifier(node.references.table)}(${escapeIdentifier(node.references.column)})`
      if (node.onDelete) {
        fk += ` ON DELETE ${formatFkAction(node.onDelete)}`
      }
      if (node.onUpdate) {
        fk += ` ON UPDATE ${formatFkAction(node.onUpdate)}`
      }
      return fk

    default:
      return null
  }
}

function generateDefaultExpression(expr: DefaultExpression): string {
  switch (expr.expressionType) {
    case 'literal':
      if (expr.dataType === 'string') {
        return `'${escapeSqlString(String(expr.value))}'`
      }
      if (expr.dataType === 'null') {
        return 'NULL'
      }
      if (expr.dataType === 'boolean') {
        return expr.value ? 'TRUE' : 'FALSE'
      }
      return String(expr.value)

    case 'function':
      const args = expr.args.map(generateDefaultExpression).join(', ')
      return `${expr.name}(${args})`

    case 'raw':
      return expr.sql

    default:
      return 'NULL'
  }
}

function formatFkAction(action: ForeignKeyAction): string {
  const mappings: Record<ForeignKeyAction, string> = {
    cascade: 'CASCADE',
    set_null: 'SET NULL',
    set_default: 'SET DEFAULT',
    restrict: 'RESTRICT',
    no_action: 'NO ACTION',
  }
  return mappings[action]
}

function generateTableConstraint(
  node: TableConstraintNode,
  _opts: Required<SqlGeneratorOptions>,
): string {
  switch (node.kind) {
    case 'primary_key':
      if ('columns' in node) {
        const cols = node.columns.map(escapeIdentifier).join(', ')
        return `PRIMARY KEY (${cols})`
      }
      return ''

    case 'unique':
      if ('columns' in node) {
        const cols = node.columns.map(escapeIdentifier).join(', ')
        return `UNIQUE (${cols})`
      }
      return ''

    case 'check':
      return `CHECK (${node.expression})`

    default:
      return ''
  }
}

function generateIndexes(
  table: TableNode,
  opts: Required<SqlGeneratorOptions>,
): string | null {
  if (table.indexes.length === 0) {
    return null
  }

  const lines: Array<string> = []
  const qualifiedTableName = qualifyName(table.name, opts.schemaName)

  for (const index of table.indexes) {
    lines.push(generateIndex(index, table.name, qualifiedTableName, opts))
  }

  return lines.join('\n')
}

function generateIndex(
  node: IndexNode,
  tableName: string,
  qualifiedTableName: string,
  _opts: Required<SqlGeneratorOptions>,
): string {
  const indexName = node.name ?? `idx_${tableName}_${node.columns.join('_')}`
  const columns = node.columns.map(escapeIdentifier).join(', ')
  const unique = node.unique ? 'UNIQUE ' : ''
  const method =
    node.method !== 'btree' ? ` USING ${node.method.toUpperCase()}` : ''

  return `CREATE ${unique}INDEX ${escapeIdentifier(indexName)} ON ${qualifiedTableName}${method} (${columns});`
}

function qualifyName(name: string, schemaName: string): string {
  if (schemaName) {
    return `${escapeIdentifier(schemaName)}.${escapeIdentifier(name)}`
  }
  return escapeIdentifier(name)
}

function escapeIdentifier(name: string): string {
  // Check if identifier needs quoting
  if (/^[a-z_][a-z0-9_]*$/.test(name) && !isReservedWord(name)) {
    return name
  }
  return `"${name.replace(/"/g, '""')}"`
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''")
}

function isReservedWord(name: string): boolean {
  const reserved = new Set([
    'all',
    'analyse',
    'analyze',
    'and',
    'any',
    'array',
    'as',
    'asc',
    'asymmetric',
    'both',
    'case',
    'cast',
    'check',
    'collate',
    'column',
    'constraint',
    'create',
    'current_catalog',
    'current_date',
    'current_role',
    'current_time',
    'current_timestamp',
    'current_user',
    'default',
    'deferrable',
    'desc',
    'distinct',
    'do',
    'else',
    'end',
    'except',
    'false',
    'fetch',
    'for',
    'foreign',
    'from',
    'grant',
    'group',
    'having',
    'in',
    'initially',
    'intersect',
    'into',
    'lateral',
    'leading',
    'limit',
    'localtime',
    'localtimestamp',
    'not',
    'null',
    'offset',
    'on',
    'only',
    'or',
    'order',
    'placing',
    'primary',
    'references',
    'returning',
    'select',
    'session_user',
    'some',
    'symmetric',
    'table',
    'then',
    'to',
    'trailing',
    'true',
    'union',
    'unique',
    'user',
    'using',
    'variadic',
    'when',
    'where',
    'window',
    'with',
  ])
  return reserved.has(name.toLowerCase())
}
