// ============================================================
// Base Types
// ============================================================

export interface Position {
  readonly offset: number
  readonly line: number
  readonly column: number
}

export interface Location {
  readonly start: Position
  readonly end: Position
}

export type NodeType =
  | 'Schema'
  | 'Table'
  | 'Column'
  | 'Enum'
  | 'EnumValue'
  | 'Constraint'
  | 'Index'
  | 'DataType'

export interface BaseNode {
  readonly type: NodeType
  readonly location: Location
}

// ============================================================
// Schema (Root Node)
// ============================================================

export interface SchemaNode extends BaseNode {
  readonly type: 'Schema'
  readonly tables: ReadonlyArray<TableNode>
  readonly enums: ReadonlyArray<EnumNode>
}

// ============================================================
// Table
// ============================================================

export interface TableNode extends BaseNode {
  readonly type: 'Table'
  readonly name: string
  readonly description: string | null
  readonly columns: ReadonlyArray<ColumnNode>
  readonly constraints: ReadonlyArray<TableConstraintNode>
  readonly indexes: ReadonlyArray<IndexNode>
}

// ============================================================
// Column
// ============================================================

export interface ColumnNode extends BaseNode {
  readonly type: 'Column'
  readonly name: string
  readonly description: string | null
  readonly dataType: DataTypeNode
  readonly constraints: ReadonlyArray<ColumnConstraintNode>
}

// ============================================================
// Data Types
// ============================================================

export type DataTypeCategory =
  | 'numeric'
  | 'text'
  | 'binary'
  | 'boolean'
  | 'datetime'
  | 'uuid'
  | 'json'
  | 'array'
  | 'network'
  | 'geometric'
  | 'custom'

export interface DataTypeNode extends BaseNode {
  readonly type: 'DataType'
  readonly name: string
  readonly category: DataTypeCategory
  readonly precision: number | null
  readonly scale: number | null
  readonly length: number | null
  readonly isArray: boolean
  readonly arrayDimensions: number
}

// ============================================================
// Constraints
// ============================================================

export type ConstraintKind =
  | 'primary_key'
  | 'foreign_key'
  | 'unique'
  | 'not_null'
  | 'default'
  | 'check'

export type ForeignKeyAction =
  | 'cascade'
  | 'set_null'
  | 'set_default'
  | 'restrict'
  | 'no_action'

// Column-level constraints
export type ColumnConstraintNode =
  | PrimaryKeyConstraint
  | ForeignKeyConstraint
  | UniqueConstraint
  | NotNullConstraint
  | DefaultConstraint
  | CheckConstraint

export interface PrimaryKeyConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'primary_key'
}

export interface ForeignKeyReference {
  readonly table: string
  readonly column: string
}

export interface ForeignKeyConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'foreign_key'
  readonly references: ForeignKeyReference
  readonly onDelete: ForeignKeyAction | null
  readonly onUpdate: ForeignKeyAction | null
}

export interface UniqueConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'unique'
}

export interface NotNullConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'not_null'
}

// Default value expressions
export type DefaultExpression =
  | LiteralExpression
  | FunctionCallExpression
  | RawSqlExpression

export interface LiteralExpression {
  readonly expressionType: 'literal'
  readonly value: string | number | boolean | null
  readonly dataType: 'string' | 'number' | 'boolean' | 'null'
}

export interface FunctionCallExpression {
  readonly expressionType: 'function'
  readonly name: string
  readonly args: ReadonlyArray<DefaultExpression>
}

export interface RawSqlExpression {
  readonly expressionType: 'raw'
  readonly sql: string
}

export interface DefaultConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'default'
  readonly expression: DefaultExpression
}

export interface CheckConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'check'
  readonly expression: string
}

// Table-level constraints
export type TableConstraintNode =
  | CompositePrimaryKeyConstraint
  | CompositeUniqueConstraint
  | TableCheckConstraint

export interface CompositePrimaryKeyConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'primary_key'
  readonly columns: ReadonlyArray<string>
}

export interface CompositeUniqueConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'unique'
  readonly columns: ReadonlyArray<string>
}

export interface TableCheckConstraint extends BaseNode {
  readonly type: 'Constraint'
  readonly kind: 'check'
  readonly expression: string
}

// ============================================================
// Index
// ============================================================

export type IndexMethod = 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin'

export interface IndexNode extends BaseNode {
  readonly type: 'Index'
  readonly columns: ReadonlyArray<string>
  readonly method: IndexMethod
  readonly unique: boolean
  readonly name: string | null
}

// ============================================================
// Enum
// ============================================================

export interface EnumNode extends BaseNode {
  readonly type: 'Enum'
  readonly name: string
  readonly description: string | null
  readonly values: ReadonlyArray<EnumValueNode>
}

export interface EnumValueNode extends BaseNode {
  readonly type: 'EnumValue'
  readonly name: string
  readonly description: string | null
}

// ============================================================
// Parse Result
// ============================================================

export interface ParseError {
  readonly message: string
  readonly location: Location
  readonly expected: ReadonlyArray<string>
  readonly found: string | null
}

export type ParseResult =
  | { readonly success: true; readonly ast: SchemaNode }
  | { readonly success: false; readonly error: ParseError }
