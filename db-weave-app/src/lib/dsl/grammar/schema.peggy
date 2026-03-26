// db-weave DSL Grammar
// PostgreSQL Schema Definition Language

{{
  function buildSchema(statements, loc) {
    const tables = []
    const enums = []

    for (const stmt of statements) {
      if (stmt.type === 'Table') {
        tables.push(stmt)
      } else if (stmt.type === 'Enum') {
        enums.push(stmt)
      }
    }

    return {
      type: 'Schema',
      tables,
      enums,
      location: loc,
    }
  }

  function buildTable(name, description, members, loc) {
    const columns = []
    const constraints = []
    const indexes = []

    for (const member of members) {
      if (member.type === 'Column') {
        columns.push(member)
      } else if (member.type === 'Index') {
        indexes.push(member)
      } else if (member.type === 'Constraint') {
        constraints.push(member)
      }
    }

    return {
      type: 'Table',
      name,
      description,
      columns,
      constraints,
      indexes,
      location: loc,
    }
  }

  function buildColumn(name, description, dataType, constraints, loc) {
    return {
      type: 'Column',
      name,
      description,
      dataType,
      constraints: constraints || [],
      location: loc,
    }
  }

  function buildDataType(name, params, arrayDims, loc) {
    const category = getTypeCategory(name)
    const isArray = arrayDims > 0

    return {
      type: 'DataType',
      name: name.toLowerCase(),
      category,
      precision: params?.precision ?? null,
      scale: params?.scale ?? null,
      length: params?.length ?? null,
      isArray,
      arrayDimensions: arrayDims,
      location: loc,
    }
  }

  function getTypeCategory(name) {
    const lower = name.toLowerCase()
    const numericTypes = ['smallint', 'integer', 'int', 'bigint', 'serial', 'bigserial', 'smallserial', 'decimal', 'numeric', 'real', 'double', 'float', 'money']
    const textTypes = ['text', 'varchar', 'char', 'character', 'citext']
    const boolTypes = ['boolean', 'bool']
    const dateTypes = ['date', 'time', 'timetz', 'timestamp', 'timestamptz', 'interval']
    const jsonTypes = ['json', 'jsonb']
    const networkTypes = ['inet', 'cidr', 'macaddr', 'macaddr8']
    const geometricTypes = ['point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle']

    if (lower === 'uuid') return 'uuid'
    if (lower === 'bytea') return 'binary'
    if (numericTypes.includes(lower)) return 'numeric'
    if (textTypes.includes(lower)) return 'text'
    if (boolTypes.includes(lower)) return 'boolean'
    if (dateTypes.includes(lower)) return 'datetime'
    if (jsonTypes.includes(lower)) return 'json'
    if (networkTypes.includes(lower)) return 'network'
    if (geometricTypes.includes(lower)) return 'geometric'
    return 'custom'
  }

  function buildEnum(name, description, values, loc) {
    return {
      type: 'Enum',
      name,
      description,
      values,
      location: loc,
    }
  }

  function buildEnumValue(name, description, loc) {
    return {
      type: 'EnumValue',
      name,
      description,
      location: loc,
    }
  }

  function buildIndex(columns, method, unique, name, loc) {
    return {
      type: 'Index',
      columns,
      method: method || 'btree',
      unique: unique || false,
      name: name || null,
      location: loc,
    }
  }

  function buildPrimaryKey(loc) {
    return {
      type: 'Constraint',
      kind: 'primary_key',
      location: loc,
    }
  }

  function buildForeignKey(table, column, loc) {
    return {
      type: 'Constraint',
      kind: 'foreign_key',
      references: { table, column },
      onDelete: null,
      onUpdate: null,
      location: loc,
    }
  }

  function buildUnique(loc) {
    return {
      type: 'Constraint',
      kind: 'unique',
      location: loc,
    }
  }

  function buildNotNull(loc) {
    return {
      type: 'Constraint',
      kind: 'not_null',
      location: loc,
    }
  }

  function buildDefault(expression, loc) {
    return {
      type: 'Constraint',
      kind: 'default',
      expression,
      location: loc,
    }
  }

  function buildCheck(expression, loc) {
    return {
      type: 'Constraint',
      kind: 'check',
      expression,
      location: loc,
    }
  }

  function buildOnDelete(action) {
    return { onAction: 'delete', action: action.toLowerCase() }
  }

  function buildOnUpdate(action) {
    return { onAction: 'update', action: action.toLowerCase() }
  }

  function buildCompositePK(columns, loc) {
    return {
      type: 'Constraint',
      kind: 'primary_key',
      columns,
      location: loc,
    }
  }

  function buildCompositeUnique(columns, loc) {
    return {
      type: 'Constraint',
      kind: 'unique',
      columns,
      location: loc,
    }
  }

  function buildTableCheck(expression, loc) {
    return {
      type: 'Constraint',
      kind: 'check',
      expression,
      location: loc,
    }
  }

  function buildLiteral(value, dataType) {
    return {
      expressionType: 'literal',
      value,
      dataType,
    }
  }

  function buildFunctionCall(name, args) {
    return {
      expressionType: 'function',
      name,
      args: args || [],
    }
  }

  function buildRawSql(sql) {
    return {
      expressionType: 'raw',
      sql,
    }
  }

  function applyFkActions(fk, actions) {
    const result = { ...fk }
    for (const action of actions) {
      if (action.onAction === 'delete') {
        result.onDelete = action.action
      } else if (action.onAction === 'update') {
        result.onUpdate = action.action
      }
    }
    return result
  }
}}

// ============================================================
// Entry Point
// ============================================================

Schema
  = _ statements:(Statement _)* {
      return buildSchema(statements.map(s => s[0]), location())
    }

Statement
  = Table
  / Enum

// ============================================================
// Table Definition
// ============================================================

Table
  = description:DocComment? _ "table"i _ name:Identifier _ "{" _
    members:(TableMember _)*
    "}" {
      return buildTable(name, description, members.map(m => m[0]), location())
    }

TableMember
  = Column
  / TableConstraint
  / Index

// ============================================================
// Column Definition
// ============================================================

Column
  = description:DocComment? _ name:Identifier __ dataType:DataType constraints:(_s ColumnConstraint)* {
      const flatConstraints = constraints.map(c => c[1])

      // Handle FK with on_delete/on_update
      const fkIndex = flatConstraints.findIndex(c => c.kind === 'foreign_key')
      if (fkIndex >= 0) {
        const actions = flatConstraints.filter(c => c.onAction)
        if (actions.length > 0) {
          flatConstraints[fkIndex] = applyFkActions(flatConstraints[fkIndex], actions)
        }
      }

      // Filter out the action-only constraints
      const finalConstraints = flatConstraints.filter(c => !c.onAction)

      return buildColumn(name, description, dataType, finalConstraints, location())
    }

// ============================================================
// Data Types
// ============================================================

DataType
  = baseType:BaseType dims:ArrayDimension* {
      return buildDataType(baseType.name, baseType.params, dims.length, location())
    }

BaseType
  = ParametrizedType
  / SimpleType

SimpleType
  = name:TypeName {
      return { name, params: null }
    }

ParametrizedType
  = name:TypeName "(" _ p1:Integer p2:(_ "," _ Integer)? _ ")" {
      const hasScale = p2 !== null
      if (hasScale) {
        return { name, params: { precision: p1, scale: p2[3] } }
      }
      return { name, params: { length: p1 } }
    }

ArrayDimension
  = "[" _ "]"

TypeName
  = $([a-zA-Z_][a-zA-Z0-9_]*)

// ============================================================
// Column Constraints
// ============================================================

ColumnConstraint
  = PrimaryKey
  / ForeignKey
  / Unique
  / NotNull
  / Default
  / Check
  / OnDelete
  / OnUpdate

PrimaryKey
  = "@pk"i { return buildPrimaryKey(location()) }

ForeignKey
  = "@fk"i "(" _ table:Identifier "." column:Identifier _ ")" {
      return buildForeignKey(table, column, location())
    }

Unique
  = "@unique"i { return buildUnique(location()) }

NotNull
  = "@not_null"i { return buildNotNull(location()) }

Default
  = "@default"i "(" _ expr:DefaultExpression _ ")" {
      return buildDefault(expr, location())
    }

Check
  = "@check"i "(" _ expr:CheckExpression _ ")" {
      return buildCheck(expr, location())
    }

OnDelete
  = "@on_delete"i "(" _ action:FkAction _ ")" {
      return buildOnDelete(action)
    }

OnUpdate
  = "@on_update"i "(" _ action:FkAction _ ")" {
      return buildOnUpdate(action)
    }

FkAction
  = "cascade"i { return 'cascade' }
  / "set_null"i { return 'set_null' }
  / "set_default"i { return 'set_default' }
  / "restrict"i { return 'restrict' }
  / "no_action"i { return 'no_action' }

// ============================================================
// Table-Level Constraints
// ============================================================

TableConstraint
  = CompositePrimaryKey
  / CompositeUnique
  / TableCheck

CompositePrimaryKey
  = "@pk"i "(" _ columns:ColumnList _ ")" {
      return buildCompositePK(columns, location())
    }

CompositeUnique
  = "@unique"i "(" _ columns:ColumnList _ ")" {
      return buildCompositeUnique(columns, location())
    }

TableCheck
  = "@check"i "(" _ expr:CheckExpression _ ")" {
      return buildTableCheck(expr, location())
    }

ColumnList
  = head:Identifier tail:(_ "," _ Identifier)* {
      return [head, ...tail.map(t => t[3])]
    }

// ============================================================
// Index Definition
// ============================================================

Index
  = "@index"i "(" _ columns:ColumnList _ ")" method:(_ "using"i __ IndexMethod)? {
      return buildIndex(columns, method ? method[3] : null, false, null, location())
    }

IndexMethod
  = "btree"i { return 'btree' }
  / "hash"i { return 'hash' }
  / "gin"i { return 'gin' }
  / "gist"i { return 'gist' }
  / "spgist"i { return 'spgist' }
  / "brin"i { return 'brin' }

// ============================================================
// Enum Definition
// ============================================================

Enum
  = description:DocComment? _ "enum"i _ name:Identifier _ "{" _
    values:(EnumValue _)*
    "}" {
      return buildEnum(name, description, values.map(v => v[0]), location())
    }

EnumValue
  = description:DocComment? _ name:Identifier {
      return buildEnumValue(name, description, location())
    }

// ============================================================
// Expressions
// ============================================================

DefaultExpression
  = FunctionCall
  / Literal
  / RawExpression

FunctionCall
  = name:Identifier "(" _ args:FunctionArgs? _ ")" {
      return buildFunctionCall(name, args)
    }

FunctionArgs
  = head:DefaultExpression tail:(_ "," _ DefaultExpression)* {
      return [head, ...tail.map(t => t[3])]
    }

Literal
  = StringLiteral
  / NumberLiteral
  / BooleanLiteral
  / NullLiteral
  / ArrayLiteral

StringLiteral
  = "'" chars:SingleQuoteChar* "'" {
      return buildLiteral(chars.join(''), 'string')
    }

SingleQuoteChar
  = "''" { return "'" }
  / [^']

NumberLiteral
  = negative:"-"? int:Integer frac:("." Integer)? {
      const numStr = (negative || '') + int + (frac ? '.' + frac[1] : '')
      return buildLiteral(parseFloat(numStr), 'number')
    }

BooleanLiteral
  = "true"i { return buildLiteral(true, 'boolean') }
  / "false"i { return buildLiteral(false, 'boolean') }

NullLiteral
  = "null"i { return buildLiteral(null, 'null') }

ArrayLiteral
  = "'{" content:ArrayContent? "}'" {
      return buildRawSql("'{" + (content || '') + "}'")
    }

ArrayContent
  = $[^}]*

RawExpression
  = chars:RawExpressionChar+ {
      return buildRawSql(chars.join(''))
    }

RawExpressionChar
  = [^(),'"@\n\r\t ]
  / "(" inner:$[^)]* ")" { return "(" + inner + ")" }

CheckExpression
  = chars:CheckExpressionChar+ {
      return chars.join('')
    }

CheckExpressionChar
  = [^()]
  / "(" inner:CheckExpressionInner ")" { return "(" + inner + ")" }

CheckExpressionInner
  = chars:CheckExpressionChar* { return chars.join('') }

// ============================================================
// Lexical Rules
// ============================================================

Identifier
  = !ReservedWord name:$([a-zA-Z_][a-zA-Z0-9_]*) { return name }

ReservedWord
  = ("table"i / "enum"i / "true"i / "false"i / "null"i / "using"i) ![a-zA-Z0-9_]

Integer
  = digits:$[0-9]+ { return parseInt(digits, 10) }

// ============================================================
// Comments and Whitespace
// ============================================================

DocComment
  = "///" _ text:$[^\n\r]* LineTerminator {
      return text.trim()
    }

LineComment
  = "//" ![/] [^\n\r]* LineTerminator?

LineTerminator
  = "\n"
  / "\r\n"
  / "\r"

// Required whitespace (at least one space/tab)
__ = [ \t]+

// Optional inline whitespace (no newlines)
_s = [ \t]*

// Optional whitespace (including newlines and comments)
_ = ([ \t\n\r] / LineComment)*
