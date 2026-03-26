// Reserved keywords that cannot be used as identifiers
export const RESERVED_KEYWORDS = new Set([
  'table',
  'enum',
  'true',
  'false',
  'null',
] as const)

// Constraint keywords
export const CONSTRAINT_KEYWORDS = new Set([
  'pk',
  'fk',
  'unique',
  'not_null',
  'default',
  'check',
  'on_delete',
  'on_update',
  'index',
] as const)

// Foreign key actions
export const FK_ACTIONS = new Set([
  'cascade',
  'set_null',
  'set_default',
  'restrict',
  'no_action',
] as const)

// Index methods
export const INDEX_METHODS = new Set([
  'btree',
  'hash',
  'gin',
  'gist',
  'spgist',
  'brin',
] as const)

// Common SQL functions for defaults
export const COMMON_FUNCTIONS = new Set([
  'now',
  'current_timestamp',
  'current_date',
  'current_time',
  'gen_random_uuid',
  'uuid_generate_v4',
  'nextval',
  'array',
] as const)

export function isReservedKeyword(name: string): boolean {
  return RESERVED_KEYWORDS.has(name.toLowerCase() as never)
}

export function isConstraintKeyword(name: string): boolean {
  return CONSTRAINT_KEYWORDS.has(name.toLowerCase() as never)
}

export function isFkAction(name: string): boolean {
  return FK_ACTIONS.has(name.toLowerCase() as never)
}

export function isIndexMethod(name: string): boolean {
  return INDEX_METHODS.has(name.toLowerCase() as never)
}
