import type { DataTypeCategory } from '../types'

export interface DataTypeInfo {
  readonly name: string
  readonly category: DataTypeCategory
  readonly aliases: ReadonlyArray<string>
  readonly hasLength: boolean
  readonly hasPrecision: boolean
  readonly hasScale: boolean
}

export const DATA_TYPES: Record<string, DataTypeInfo> = {
  // Numeric types
  smallint: {
    name: 'smallint',
    category: 'numeric',
    aliases: ['int2'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  integer: {
    name: 'integer',
    category: 'numeric',
    aliases: ['int', 'int4'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  bigint: {
    name: 'bigint',
    category: 'numeric',
    aliases: ['int8'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  serial: {
    name: 'serial',
    category: 'numeric',
    aliases: ['serial4'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  bigserial: {
    name: 'bigserial',
    category: 'numeric',
    aliases: ['serial8'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  smallserial: {
    name: 'smallserial',
    category: 'numeric',
    aliases: ['serial2'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  decimal: {
    name: 'decimal',
    category: 'numeric',
    aliases: ['numeric'],
    hasLength: false,
    hasPrecision: true,
    hasScale: true,
  },
  numeric: {
    name: 'numeric',
    category: 'numeric',
    aliases: ['decimal'],
    hasLength: false,
    hasPrecision: true,
    hasScale: true,
  },
  real: {
    name: 'real',
    category: 'numeric',
    aliases: ['float4'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  double: {
    name: 'double precision',
    category: 'numeric',
    aliases: ['float8', 'float'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  money: {
    name: 'money',
    category: 'numeric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // Text types
  text: {
    name: 'text',
    category: 'text',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  varchar: {
    name: 'character varying',
    category: 'text',
    aliases: ['character varying'],
    hasLength: true,
    hasPrecision: false,
    hasScale: false,
  },
  char: {
    name: 'character',
    category: 'text',
    aliases: ['character'],
    hasLength: true,
    hasPrecision: false,
    hasScale: false,
  },
  citext: {
    name: 'citext',
    category: 'text',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // Binary types
  bytea: {
    name: 'bytea',
    category: 'binary',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // Boolean types
  boolean: {
    name: 'boolean',
    category: 'boolean',
    aliases: ['bool'],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // Date/Time types
  date: {
    name: 'date',
    category: 'datetime',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  time: {
    name: 'time',
    category: 'datetime',
    aliases: ['time without time zone'],
    hasLength: false,
    hasPrecision: true,
    hasScale: false,
  },
  timetz: {
    name: 'time with time zone',
    category: 'datetime',
    aliases: ['time with time zone'],
    hasLength: false,
    hasPrecision: true,
    hasScale: false,
  },
  timestamp: {
    name: 'timestamp',
    category: 'datetime',
    aliases: ['timestamp without time zone'],
    hasLength: false,
    hasPrecision: true,
    hasScale: false,
  },
  timestamptz: {
    name: 'timestamp with time zone',
    category: 'datetime',
    aliases: ['timestamptz'],
    hasLength: false,
    hasPrecision: true,
    hasScale: false,
  },
  interval: {
    name: 'interval',
    category: 'datetime',
    aliases: [],
    hasLength: false,
    hasPrecision: true,
    hasScale: false,
  },

  // UUID
  uuid: {
    name: 'uuid',
    category: 'uuid',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // JSON types
  json: {
    name: 'json',
    category: 'json',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  jsonb: {
    name: 'jsonb',
    category: 'json',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // Network types
  inet: {
    name: 'inet',
    category: 'network',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  cidr: {
    name: 'cidr',
    category: 'network',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  macaddr: {
    name: 'macaddr',
    category: 'network',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  macaddr8: {
    name: 'macaddr8',
    category: 'network',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },

  // Geometric types
  point: {
    name: 'point',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  line: {
    name: 'line',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  lseg: {
    name: 'lseg',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  box: {
    name: 'box',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  path: {
    name: 'path',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  polygon: {
    name: 'polygon',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
  circle: {
    name: 'circle',
    category: 'geometric',
    aliases: [],
    hasLength: false,
    hasPrecision: false,
    hasScale: false,
  },
} as const

const TYPE_ALIAS_MAP: Record<string, string> = {}

for (const [typeName, info] of Object.entries(DATA_TYPES)) {
  for (const alias of info.aliases) {
    TYPE_ALIAS_MAP[alias.toLowerCase()] = typeName
  }
}

export function resolveTypeName(name: string): string {
  const lower = name.toLowerCase()
  return TYPE_ALIAS_MAP[lower] ?? lower
}

export function getTypeInfo(name: string): DataTypeInfo | null {
  const resolved = resolveTypeName(name)
  return DATA_TYPES[resolved] ?? null
}

export function getTypeCategory(name: string): DataTypeCategory {
  const info = getTypeInfo(name)
  return info?.category ?? 'custom'
}

export function isBuiltinType(name: string): boolean {
  return getTypeInfo(name) !== null
}
