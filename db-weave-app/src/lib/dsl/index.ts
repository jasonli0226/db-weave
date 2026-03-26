// Public API for db-weave DSL

// Types
export type {
  // Base types
  Position,
  Location,
  NodeType,
  BaseNode,
  // Schema
  SchemaNode,
  // Table
  TableNode,
  // Column
  ColumnNode,
  // Data types
  DataTypeCategory,
  DataTypeNode,
  // Constraints
  ConstraintKind,
  ForeignKeyAction,
  ColumnConstraintNode,
  PrimaryKeyConstraint,
  ForeignKeyReference,
  ForeignKeyConstraint,
  UniqueConstraint,
  NotNullConstraint,
  DefaultConstraint,
  CheckConstraint,
  TableConstraintNode,
  CompositePrimaryKeyConstraint,
  CompositeUniqueConstraint,
  TableCheckConstraint,
  // Default expressions
  DefaultExpression,
  LiteralExpression,
  FunctionCallExpression,
  RawSqlExpression,
  // Index
  IndexMethod,
  IndexNode,
  // Enum
  EnumNode,
  EnumValueNode,
  // Parse result
  ParseError,
  ParseResult,
} from './types'

// Parser
export { parse, parseOrThrow } from './parser'
export type { ParserOptions } from './parser'

// Generators
export { generateSql } from './generator'
export type { SqlGeneratorOptions } from './generator'

// Utilities
export {
  DATA_TYPES,
  resolveTypeName,
  getTypeInfo,
  getTypeCategory,
  isBuiltinType,
} from './utils/data-types'

export {
  RESERVED_KEYWORDS,
  CONSTRAINT_KEYWORDS,
  FK_ACTIONS,
  INDEX_METHODS,
  isReservedKeyword,
  isConstraintKeyword,
  isFkAction,
  isIndexMethod,
} from './utils/constants'
