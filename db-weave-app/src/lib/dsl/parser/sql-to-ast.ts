import { Parser } from 'node-sql-parser'
import type {
  ColumnConstraintNode,
  ColumnNode,
  DataTypeNode,
  DefaultExpression,
  EnumNode,
  ForeignKeyAction,
  IndexMethod,
  IndexNode,
  Location,
  SchemaNode,
  TableConstraintNode,
  TableNode,
} from '../types'

const parser = new Parser()

export interface SqlToAstOptions {
  readonly database?: 'postgresql' | 'mysql'
}

const DEFAULT_OPTIONS: Required<SqlToAstOptions> = {
  database: 'postgresql',
}

export interface SqlToAstResult {
  readonly success: boolean
  readonly ast?: SchemaNode
  readonly error?: string
}

const defaultLocation: Location = {
  start: { offset: 0, line: 1, column: 1 },
  end: { offset: 0, line: 1, column: 1 },
}

export function sqlToAst(
  sql: string,
  options?: SqlToAstOptions,
): SqlToAstResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  try {
    // Parse SQL with node-sql-parser
    const sqlAst = parser.astify(sql, { database: opts.database })

    // Convert to array if single statement
    const statements = Array.isArray(sqlAst) ? sqlAst : [sqlAst]

    const tables: Array<TableNode> = []
    const enums: Array<EnumNode> = []

    for (const stmt of statements) {
      if (!stmt || typeof stmt !== 'object') continue

      // Handle CREATE TABLE
      if (stmt.type === 'create' && stmt.keyword === 'table') {
        const table = convertCreateTable(stmt as any)
        if (table) tables.push(table)
      }

      // Handle CREATE TYPE (enums)
      if (stmt.type === 'create' && stmt.keyword === 'type') {
        const enumNode = convertCreateType(stmt as any)
        if (enumNode) enums.push(enumNode)
      }

      // Handle CREATE INDEX
      if (stmt.type === 'create' && stmt.keyword === 'index') {
        const index = convertCreateIndex(stmt as any)
        if (index) {
          // Find the table and add the index
          const tableName = (stmt as any).table?.[0]?.table
          const table = tables.find((t) => t.name === tableName)
          if (table) {
            tables[tables.indexOf(table)] = {
              ...table,
              indexes: [...table.indexes, index],
            }
          }
        }
      }

      // Handle ALTER TABLE ADD FOREIGN KEY
      if (stmt.type === 'alter') {
        applyAlterTable(stmt as any, tables)
      }
    }

    const schema: SchemaNode = {
      type: 'Schema',
      tables,
      enums,
      location: defaultLocation,
    }

    return {
      success: true,
      ast: schema,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown parsing error',
    }
  }
}

function convertCreateTable(stmt: any): TableNode | null {
  if (!stmt.table || !stmt.table[0]) return null

  const tableName = stmt.table[0].table
  const columns: Array<ColumnNode> = []
  const constraints: Array<TableConstraintNode> = []
  const indexes: Array<IndexNode> = []

  // Process column definitions
  if (stmt.create_definitions) {
    for (const def of stmt.create_definitions) {
      if (def.resource === 'column') {
        const column = convertColumn(def)
        if (column) {
          columns.push(column)
        }
      } else if (def.resource === 'constraint') {
        const constraint = convertTableConstraint(def)
        if (constraint) constraints.push(constraint)
      }
    }
  }

  return {
    type: 'Table',
    name: tableName,
    description: null,
    columns,
    constraints,
    indexes,
    location: defaultLocation,
  }
}

function convertColumn(def: any): ColumnNode | null {
  if (!def.column) return null

  // Extract column name - handle various formats from node-sql-parser
  let name: string | undefined

  if (typeof def.column === 'string') {
    name = def.column
  } else if (typeof def.column === 'object' && def.column !== null) {
    // The structure is: def.column.column.expr.value
    if (
      def.column.column &&
      def.column.column.expr &&
      def.column.column.expr.value
    ) {
      name = def.column.column.expr.value
    }
    // Also try other possible structures as fallback
    else if (typeof def.column.column === 'string') {
      name = def.column.column
    } else if (def.column.expr && typeof def.column.expr.column === 'string') {
      name = def.column.expr.column
    } else if (def.column.value && typeof def.column.value === 'string') {
      name = def.column.value
    }
  }

  if (!name || typeof name !== 'string') {
    // Unable to extract column name
    return null
  }

  const dataType = convertDataType(def.definition)
  const constraints: Array<ColumnConstraintNode> = []

  // Extract constraints in typical SQL order: PK, UNIQUE, NOT NULL, DEFAULT, FK

  // Check for primary key (can be at def.primary_key or def.unique_or_primary)
  if (
    def.primary_key === 'primary key' ||
    def.unique_or_primary === 'primary key'
  ) {
    constraints.push({
      type: 'Constraint',
      kind: 'primary_key',
      location: defaultLocation,
    })
  }

  // Check for unique (can be at def.unique or def.unique_or_primary)
  if (def.unique === 'unique' || def.unique_or_primary === 'unique') {
    constraints.push({
      type: 'Constraint',
      kind: 'unique',
      location: defaultLocation,
    })
  }

  // Extract NOT NULL constraint
  if (def.nullable && def.nullable.type === 'not null') {
    constraints.push({
      type: 'Constraint',
      kind: 'not_null',
      location: defaultLocation,
    })
  }

  // Extract DEFAULT constraint
  if (def.default_val) {
    const defaultExpr = convertDefaultValue(def.default_val)
    if (defaultExpr) {
      constraints.push({
        type: 'Constraint',
        kind: 'default',
        expression: defaultExpr,
        location: defaultLocation,
      })
    }
  }

  // Extract FOREIGN KEY constraint
  if (def.reference_definition) {
    const fkConstraint = convertForeignKey(def.reference_definition)
    if (fkConstraint) {
      constraints.push(fkConstraint)
    }
  }

  return {
    type: 'Column',
    name,
    description: null,
    dataType,
    constraints,
    location: defaultLocation,
  }
}

const BUILTIN_TYPE_NAMES = new Set([
  'smallint', 'integer', 'int', 'bigint', 'serial', 'bigserial', 'smallserial',
  'decimal', 'numeric', 'real', 'double', 'double precision', 'float', 'money',
  'text', 'varchar', 'char', 'character', 'character varying', 'citext',
  'boolean', 'bool', 'bytea',
  'date', 'time', 'timetz', 'timestamp', 'timestamptz', 'interval',
  'uuid', 'json', 'jsonb',
  'inet', 'cidr', 'macaddr', 'macaddr8',
  'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle',
])

function isBuiltinTypeName(name: string): boolean {
  return BUILTIN_TYPE_NAMES.has(name.toLowerCase())
}

// Multi-word SQL types that must be collapsed to single-word DSL type names
const MULTI_WORD_TYPE_MAP: Record<string, string> = {
  'double precision': 'double',
  'character varying': 'varchar',
}

function normalizeMultiWordType(name: string): string {
  return MULTI_WORD_TYPE_MAP[name.toLowerCase()] ?? name
}

function convertDataType(def: any): DataTypeNode {
  if (!def || !def.dataType) {
    return {
      type: 'DataType',
      name: 'text',
      category: 'text',
      precision: null,
      scale: null,
      length: null,
      isArray: false,
      arrayDimensions: 0,
      location: defaultLocation,
    }
  }

  // Strip surrounding quotes from type name (node-sql-parser preserves them for quoted identifiers)
  const rawTypeName = def.dataType.replace(/^"|"$/g, '')
  // Strip array suffix for type lookup (array suffix is handled separately via def.suffix)
  const baseTypeName = rawTypeName.replace(/\[\]$/, '')
  // Only lowercase built-in types; preserve original casing for custom types (e.g. enums)
  const isBuiltin = isBuiltinTypeName(baseTypeName)
  // Normalize multi-word SQL types to single-word DSL equivalents
  const normalizedTypeName = normalizeMultiWordType(isBuiltin ? baseTypeName.toLowerCase() : baseTypeName)
  const dataTypeName = isBuiltin ? normalizedTypeName : baseTypeName
  const length = def.length ? parseInt(def.length, 10) : null
  const precision = def.precision ? parseInt(def.precision, 10) : null
  const scale = def.scale ? parseInt(def.scale, 10) : null
  const isArray = def.suffix === '[]' || rawTypeName.endsWith('[]')

  return {
    type: 'DataType',
    name: dataTypeName,
    category: getTypeCategory(dataTypeName),
    precision,
    scale,
    length,
    isArray,
    arrayDimensions: isArray ? 1 : 0,
    location: defaultLocation,
  }
}

function getTypeCategory(name: string): any {
  const lower = name.toLowerCase()
  const numericTypes = [
    'smallint',
    'integer',
    'int',
    'bigint',
    'serial',
    'bigserial',
    'smallserial',
    'decimal',
    'numeric',
    'real',
    'double',
    'float',
    'money',
  ]
  const textTypes = ['text', 'varchar', 'char', 'character', 'citext']
  const boolTypes = ['boolean', 'bool']
  const dateTypes = [
    'date',
    'time',
    'timetz',
    'timestamp',
    'timestamptz',
    'interval',
  ]
  const jsonTypes = ['json', 'jsonb']

  if (lower === 'uuid') return 'uuid'
  if (lower === 'bytea') return 'binary'
  if (numericTypes.includes(lower)) return 'numeric'
  if (textTypes.includes(lower)) return 'text'
  if (boolTypes.includes(lower)) return 'boolean'
  if (dateTypes.includes(lower)) return 'datetime'
  if (jsonTypes.includes(lower)) return 'json'
  return 'custom'
}

function convertDefaultValue(def: any): DefaultExpression | null {
  if (!def || !def.value) return null

  const val = def.value

  // Handle function calls - structure: value.name.name[0].value
  if (val.type === 'function') {
    let funcName = 'unknown'
    if (
      val.name &&
      val.name.name &&
      Array.isArray(val.name.name) &&
      val.name.name[0]
    ) {
      funcName = val.name.name[0].value || val.name.name[0]
    } else if (typeof val.name === 'string') {
      funcName = val.name
    }

    return {
      expressionType: 'function',
      name: funcName.toLowerCase(),
      args: [],
    }
  }

  // Handle string literals - can be 'single_quote_string' or just 'string'
  if (val.type === 'single_quote_string' || val.type === 'string') {
    return {
      expressionType: 'literal',
      value: val.value,
      dataType: 'string',
    }
  }

  // Handle number literals
  if (val.type === 'number') {
    return {
      expressionType: 'literal',
      value: parseFloat(val.value),
      dataType: 'number',
    }
  }

  // Handle boolean literals
  if (val.type === 'bool') {
    return {
      expressionType: 'literal',
      value: val.value === 1 || val.value === true || val.value === 'true',
      dataType: 'boolean',
    }
  }

  // Handle null
  if (val.type === 'null') {
    return {
      expressionType: 'literal',
      value: null,
      dataType: 'null',
    }
  }

  return null
}

function convertForeignKey(def: any): ColumnConstraintNode | null {
  if (!def || !def.table || !def.table[0]) return null

  const table = def.table[0].table

  // Extract referenced column name from the complex structure
  let column = 'id' // default
  if (def.definition && def.definition[0]) {
    const colDef = def.definition[0]
    if (colDef.column && colDef.column.expr && colDef.column.expr.value) {
      column = colDef.column.expr.value
    } else if (typeof colDef.column === 'string') {
      column = colDef.column
    }
  }

  let onDelete: ForeignKeyAction | null = null
  let onUpdate: ForeignKeyAction | null = null

  // Process on_action array
  if (def.on_action && Array.isArray(def.on_action)) {
    for (const action of def.on_action) {
      if (action.type === 'on delete' && action.value) {
        onDelete = convertFkAction(action.value.value || action.value)
      } else if (action.type === 'on update' && action.value) {
        onUpdate = convertFkAction(action.value.value || action.value)
      }
    }
  }

  // Also check old format for backwards compatibility
  if (def.on_delete) {
    onDelete = convertFkAction(def.on_delete)
  }

  if (def.on_update) {
    onUpdate = convertFkAction(def.on_update)
  }

  return {
    type: 'Constraint',
    kind: 'foreign_key',
    references: { table, column },
    onDelete,
    onUpdate,
    location: defaultLocation,
  }
}

function convertFkAction(action: string): ForeignKeyAction {
  const normalized = action.toLowerCase().replace(/\s+/g, '_')
  switch (normalized) {
    case 'cascade':
      return 'cascade'
    case 'set_null':
      return 'set_null'
    case 'set_default':
      return 'set_default'
    case 'restrict':
      return 'restrict'
    case 'no_action':
      return 'no_action'
    default:
      return 'no_action'
  }
}

function extractColumnName(col: any): string {
  // Handle string directly
  if (typeof col === 'string') {
    return col
  }

  // Handle object with column property
  if (col.column) {
    if (typeof col.column === 'string') {
      return col.column
    }
    // Handle nested structure: col.column.expr.value
    if (col.column.expr && col.column.expr.value) {
      return col.column.expr.value
    }
  }

  // Fallback to empty string
  return ''
}

function convertTableConstraint(def: any): TableConstraintNode | null {
  if (!def.constraint_type) return null

  const constraintType = def.constraint_type.toLowerCase()

  if (constraintType === 'primary key') {
    const columns = (def.definition || [])
      .map((col: any) => extractColumnName(col))
      .filter((name: string) => name !== '')
    return {
      type: 'Constraint',
      kind: 'primary_key',
      columns,
      location: defaultLocation,
    }
  }

  if (constraintType === 'unique') {
    const columns = (def.definition || [])
      .map((col: any) => extractColumnName(col))
      .filter((name: string) => name !== '')
    return {
      type: 'Constraint',
      kind: 'unique',
      columns,
      location: defaultLocation,
    }
  }

  if (constraintType === 'check') {
    const expression = def.definition || ''
    return {
      type: 'Constraint',
      kind: 'check',
      expression,
      location: defaultLocation,
    }
  }

  return null
}

function applyAlterTable(stmt: any, tables: Array<TableNode>): void {
  const tableName = stmt.table?.[0]?.table
  if (!tableName) return

  const tableIndex = tables.findIndex((t) => t.name === tableName)
  if (tableIndex === -1) return

  const table = tables[tableIndex]
  const exprs = stmt.expr || []

  for (const expr of exprs) {
    if (expr.action !== 'add' || expr.resource !== 'constraint') continue

    const rawConstraintType = expr.create_definitions?.constraint_type
    const constraintType = typeof rawConstraintType === 'string'
      ? rawConstraintType.toLowerCase()
      : rawConstraintType?.constraint?.toLowerCase()
    if (constraintType !== 'foreign key') continue

    // Extract the source column(s)
    const sourceColumns = (expr.create_definitions?.definition || [])
      .map((col: any) => extractColumnName(col))
      .filter((name: string) => name !== '')

    // Extract the referenced table and column from reference_definition
    const refDef = expr.create_definitions?.reference_definition
    if (!refDef) continue

    const refTable = refDef.table?.[0]?.table
    if (!refTable) continue

    let refColumn = 'id'
    if (refDef.definition && refDef.definition[0]) {
      const colDef = refDef.definition[0]
      if (colDef.column && colDef.column.expr && colDef.column.expr.value) {
        refColumn = colDef.column.expr.value
      } else if (typeof colDef.column === 'string') {
        refColumn = colDef.column
      }
    }

    let onDelete: ForeignKeyAction | null = null
    let onUpdate: ForeignKeyAction | null = null

    if (refDef.on_action && Array.isArray(refDef.on_action)) {
      for (const action of refDef.on_action) {
        if (action.type === 'on delete' && action.value) {
          onDelete = convertFkAction(action.value.value || action.value)
        } else if (action.type === 'on update' && action.value) {
          onUpdate = convertFkAction(action.value.value || action.value)
        }
      }
    }

    // Apply FK constraint to the source column
    if (sourceColumns.length === 1) {
      const colIndex = table.columns.findIndex((c) => c.name === sourceColumns[0])
      if (colIndex !== -1) {
        const col = table.columns[colIndex]
        const fkConstraint: ColumnConstraintNode = {
          type: 'Constraint',
          kind: 'foreign_key',
          references: { table: refTable, column: refColumn },
          onDelete,
          onUpdate,
          location: defaultLocation,
        }
        const updatedColumns = [...table.columns]
        updatedColumns[colIndex] = {
          ...col,
          constraints: [...col.constraints, fkConstraint],
        }
        tables[tableIndex] = { ...table, columns: updatedColumns }
      }
    }
  }
}

function convertCreateType(stmt: any): EnumNode | null {
  if (!stmt.keyword || stmt.keyword !== 'type') return null
  if (!stmt.resource || stmt.resource !== 'enum') return null

  // Extract name from stmt.name.name
  const name = stmt.name?.name || 'unknown'

  // Extract values from stmt.create_definitions.value
  const valuesList = stmt.create_definitions?.value || []
  const values = valuesList.map((v: any) => ({
    type: 'EnumValue' as const,
    name: v.value,
    description: null,
    location: defaultLocation,
  }))

  return {
    type: 'Enum',
    name,
    description: null,
    values,
    location: defaultLocation,
  }
}

function convertCreateIndex(stmt: any): IndexNode | null {
  if (!stmt.index || !stmt.table) return null

  const columns = (stmt.definition || []).map((col: any) => col.column)
  const method: IndexMethod =
    (stmt.using?.toLowerCase() as IndexMethod) || 'btree'
  const unique = stmt.index_type === 'unique'
  const name = stmt.index

  return {
    type: 'Index',
    columns,
    method,
    unique,
    name,
    location: defaultLocation,
  }
}
