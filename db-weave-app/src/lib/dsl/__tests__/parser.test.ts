import { describe, expect, it } from 'vitest'
import { parse, parseOrThrow } from '../parser'

describe('DSL Parser', () => {
  describe('empty schema', () => {
    it('parses empty input', () => {
      const result = parse('')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.ast.type).toBe('Schema')
        expect(result.ast.tables).toHaveLength(0)
        expect(result.ast.enums).toHaveLength(0)
      }
    })

    it('parses whitespace only', () => {
      const result = parse('   \n\n\t  ')
      expect(result.success).toBe(true)
    })

    it('parses comments only', () => {
      const result = parse('// this is a comment\n// another comment')
      expect(result.success).toBe(true)
    })
  })

  describe('table parsing', () => {
    it('parses simple table', () => {
      const input = `
        table users {
          id uuid @pk
          name text
        }
      `
      const ast = parseOrThrow(input)
      expect(ast.tables).toHaveLength(1)
      expect(ast.tables[0].name).toBe('users')
      expect(ast.tables[0].columns).toHaveLength(2)
    })

    it('parses table with doc comment', () => {
      const input = `
        /// User accounts table
        table users {
          id uuid @pk
        }
      `
      const ast = parseOrThrow(input)
      expect(ast.tables[0].description).toBe('User accounts table')
    })

    it('parses multiple tables', () => {
      const input = `
        table users {
          id uuid @pk
        }

        table posts {
          id uuid @pk
        }
      `
      const ast = parseOrThrow(input)
      expect(ast.tables).toHaveLength(2)
      expect(ast.tables[0].name).toBe('users')
      expect(ast.tables[1].name).toBe('posts')
    })
  })

  describe('column parsing', () => {
    it('parses column with doc comment', () => {
      const input = `
        table users {
          /// Primary identifier
          id uuid @pk
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.description).toBe('Primary identifier')
    })

    it('parses column without constraints', () => {
      const input = `
        table users {
          name text
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.name).toBe('name')
      expect(column.dataType.name).toBe('text')
      expect(column.constraints).toHaveLength(0)
    })
  })

  describe('data types', () => {
    it('parses simple types', () => {
      const input = `
        table test {
          a uuid
          b text
          c integer
          d boolean
          e jsonb
          f timestamp
          g timestamptz
        }
      `
      const ast = parseOrThrow(input)
      const columns = ast.tables[0].columns

      expect(columns[0].dataType.name).toBe('uuid')
      expect(columns[0].dataType.category).toBe('uuid')

      expect(columns[1].dataType.name).toBe('text')
      expect(columns[1].dataType.category).toBe('text')

      expect(columns[2].dataType.name).toBe('integer')
      expect(columns[2].dataType.category).toBe('numeric')

      expect(columns[3].dataType.name).toBe('boolean')
      expect(columns[3].dataType.category).toBe('boolean')

      expect(columns[4].dataType.name).toBe('jsonb')
      expect(columns[4].dataType.category).toBe('json')

      expect(columns[5].dataType.name).toBe('timestamp')
      expect(columns[5].dataType.category).toBe('datetime')

      expect(columns[6].dataType.name).toBe('timestamptz')
      expect(columns[6].dataType.category).toBe('datetime')
    })

    it('parses parametrized types', () => {
      const input = `
        table test {
          a varchar(255)
          b numeric(10, 2)
          c char(1)
        }
      `
      const ast = parseOrThrow(input)
      const columns = ast.tables[0].columns

      expect(columns[0].dataType.name).toBe('varchar')
      expect(columns[0].dataType.length).toBe(255)

      expect(columns[1].dataType.name).toBe('numeric')
      expect(columns[1].dataType.precision).toBe(10)
      expect(columns[1].dataType.scale).toBe(2)

      expect(columns[2].dataType.name).toBe('char')
      expect(columns[2].dataType.length).toBe(1)
    })

    it('parses array types', () => {
      const input = `
        table test {
          tags text[]
          matrix integer[][]
        }
      `
      const ast = parseOrThrow(input)
      const columns = ast.tables[0].columns

      expect(columns[0].dataType.isArray).toBe(true)
      expect(columns[0].dataType.arrayDimensions).toBe(1)

      expect(columns[1].dataType.isArray).toBe(true)
      expect(columns[1].dataType.arrayDimensions).toBe(2)
    })

    it('parses custom types (enums)', () => {
      const input = `
        table test {
          status user_status
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.dataType.name).toBe('user_status')
      expect(column.dataType.category).toBe('custom')
    })
  })

  describe('column constraints', () => {
    it('parses @pk constraint', () => {
      const input = `
        table users {
          id uuid @pk
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.constraints).toHaveLength(1)
      expect(column.constraints[0].kind).toBe('primary_key')
    })

    it('parses @unique constraint', () => {
      const input = `
        table users {
          email text @unique
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.constraints[0].kind).toBe('unique')
    })

    it('parses @not_null constraint', () => {
      const input = `
        table users {
          name text @not_null
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.constraints[0].kind).toBe('not_null')
    })

    it('parses multiple constraints', () => {
      const input = `
        table users {
          email varchar(255) @unique @not_null
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      expect(column.constraints).toHaveLength(2)
      expect(column.constraints[0].kind).toBe('unique')
      expect(column.constraints[1].kind).toBe('not_null')
    })

    it('parses @default with function call', () => {
      const input = `
        table users {
          id uuid @default(gen_random_uuid())
          created_at timestamptz @default(now())
        }
      `
      const ast = parseOrThrow(input)
      const columns = ast.tables[0].columns

      const defaultExpr0 = columns[0].constraints[0]
      expect(defaultExpr0.kind).toBe('default')
      if (defaultExpr0.kind === 'default') {
        expect(defaultExpr0.expression.expressionType).toBe('function')
        if (defaultExpr0.expression.expressionType === 'function') {
          expect(defaultExpr0.expression.name).toBe('gen_random_uuid')
        }
      }

      const defaultExpr1 = columns[1].constraints[0]
      if (defaultExpr1.kind === 'default') {
        expect(defaultExpr1.expression.expressionType).toBe('function')
        if (defaultExpr1.expression.expressionType === 'function') {
          expect(defaultExpr1.expression.name).toBe('now')
        }
      }
    })

    it('parses @default with literal values', () => {
      const input = `
        table test {
          active boolean @default(true)
          count integer @default(0)
          name text @default('unknown')
          data jsonb @default('{}')
        }
      `
      const ast = parseOrThrow(input)
      const columns = ast.tables[0].columns

      const d0 = columns[0].constraints[0]
      if (d0.kind === 'default' && d0.expression.expressionType === 'literal') {
        expect(d0.expression.value).toBe(true)
        expect(d0.expression.dataType).toBe('boolean')
      }

      const d1 = columns[1].constraints[0]
      if (d1.kind === 'default' && d1.expression.expressionType === 'literal') {
        expect(d1.expression.value).toBe(0)
        expect(d1.expression.dataType).toBe('number')
      }

      const d2 = columns[2].constraints[0]
      if (d2.kind === 'default' && d2.expression.expressionType === 'literal') {
        expect(d2.expression.value).toBe('unknown')
        expect(d2.expression.dataType).toBe('string')
      }
    })

    it('parses @check constraint', () => {
      const input = `
        table users {
          age integer @check(age >= 0)
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      const check = column.constraints[0]
      expect(check.kind).toBe('check')
      if (check.kind === 'check') {
        expect(check.expression).toBe('age >= 0')
      }
    })
  })

  describe('foreign keys', () => {
    it('parses @fk constraint', () => {
      const input = `
        table posts {
          user_id uuid @fk(users.id)
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      const fk = column.constraints[0]
      expect(fk.kind).toBe('foreign_key')
      if (fk.kind === 'foreign_key') {
        expect(fk.references.table).toBe('users')
        expect(fk.references.column).toBe('id')
      }
    })

    it('parses @fk with @on_delete', () => {
      const input = `
        table posts {
          user_id uuid @fk(users.id) @on_delete(cascade)
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      const fk = column.constraints[0]
      if (fk.kind === 'foreign_key') {
        expect(fk.onDelete).toBe('cascade')
      }
    })

    it('parses @fk with @on_update', () => {
      const input = `
        table posts {
          user_id uuid @fk(users.id) @on_update(set_null)
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      const fk = column.constraints[0]
      if (fk.kind === 'foreign_key') {
        expect(fk.onUpdate).toBe('set_null')
      }
    })

    it('parses @fk with both actions', () => {
      const input = `
        table posts {
          user_id uuid @fk(users.id) @on_delete(cascade) @on_update(restrict)
        }
      `
      const ast = parseOrThrow(input)
      const column = ast.tables[0].columns[0]
      const fk = column.constraints[0]
      if (fk.kind === 'foreign_key') {
        expect(fk.onDelete).toBe('cascade')
        expect(fk.onUpdate).toBe('restrict')
      }
    })

    it('parses all FK actions', () => {
      const actions = [
        'cascade',
        'set_null',
        'set_default',
        'restrict',
        'no_action',
      ]
      for (const action of actions) {
        const input = `
          table posts {
            user_id uuid @fk(users.id) @on_delete(${action})
          }
        `
        const ast = parseOrThrow(input)
        const fk = ast.tables[0].columns[0].constraints[0]
        if (fk.kind === 'foreign_key') {
          expect(fk.onDelete).toBe(action)
        }
      }
    })
  })

  describe('table-level constraints', () => {
    it('parses composite primary key', () => {
      const input = `
        table user_roles {
          user_id uuid
          role_id uuid
          @pk(user_id, role_id)
        }
      `
      const ast = parseOrThrow(input)
      const table = ast.tables[0]
      expect(table.constraints).toHaveLength(1)
      const pk = table.constraints[0]
      expect(pk.kind).toBe('primary_key')
      if (pk.kind === 'primary_key' && 'columns' in pk) {
        expect(pk.columns).toEqual(['user_id', 'role_id'])
      }
    })

    it('parses composite unique constraint', () => {
      const input = `
        table posts {
          author_id uuid
          title text
          @unique(author_id, title)
        }
      `
      const ast = parseOrThrow(input)
      const table = ast.tables[0]
      const unique = table.constraints[0]
      expect(unique.kind).toBe('unique')
      if (unique.kind === 'unique' && 'columns' in unique) {
        expect(unique.columns).toEqual(['author_id', 'title'])
      }
    })

    it('parses table-level check constraint', () => {
      const input = `
        table products {
          min_price integer
          max_price integer
          @check(min_price <= max_price)
        }
      `
      const ast = parseOrThrow(input)
      const check = ast.tables[0].constraints[0]
      expect(check.kind).toBe('check')
      if (check.kind === 'check') {
        expect(check.expression).toBe('min_price <= max_price')
      }
    })
  })

  describe('indexes', () => {
    it('parses single column index', () => {
      const input = `
        table users {
          email text
          @index(email)
        }
      `
      const ast = parseOrThrow(input)
      const index = ast.tables[0].indexes[0]
      expect(index.columns).toEqual(['email'])
      expect(index.method).toBe('btree')
    })

    it('parses multi-column index', () => {
      const input = `
        table users {
          first_name text
          last_name text
          @index(first_name, last_name)
        }
      `
      const ast = parseOrThrow(input)
      const index = ast.tables[0].indexes[0]
      expect(index.columns).toEqual(['first_name', 'last_name'])
    })

    it('parses index with method', () => {
      const input = `
        table users {
          data jsonb
          @index(data) using gin
        }
      `
      const ast = parseOrThrow(input)
      const index = ast.tables[0].indexes[0]
      expect(index.method).toBe('gin')
    })

    it('parses all index methods', () => {
      const methods = ['btree', 'hash', 'gin', 'gist', 'spgist', 'brin']
      for (const method of methods) {
        const input = `
          table test {
            col text
            @index(col) using ${method}
          }
        `
        const ast = parseOrThrow(input)
        expect(ast.tables[0].indexes[0].method).toBe(method)
      }
    })
  })

  describe('enums', () => {
    it('parses simple enum', () => {
      const input = `
        enum status {
          pending
          active
          archived
        }
      `
      const ast = parseOrThrow(input)
      expect(ast.enums).toHaveLength(1)
      expect(ast.enums[0].name).toBe('status')
      expect(ast.enums[0].values).toHaveLength(3)
      expect(ast.enums[0].values[0].name).toBe('pending')
      expect(ast.enums[0].values[1].name).toBe('active')
      expect(ast.enums[0].values[2].name).toBe('archived')
    })

    it('parses enum with doc comments', () => {
      const input = `
        /// User account status
        enum user_status {
          /// Awaiting verification
          pending
          /// Active account
          active
          /// Soft deleted
          deleted
        }
      `
      const ast = parseOrThrow(input)
      expect(ast.enums[0].description).toBe('User account status')
      expect(ast.enums[0].values[0].description).toBe('Awaiting verification')
      expect(ast.enums[0].values[1].description).toBe('Active account')
      expect(ast.enums[0].values[2].description).toBe('Soft deleted')
    })
  })

  describe('complete schema', () => {
    it('parses a complete schema with tables and enums', () => {
      const input = `
        /// User account status
        enum user_status {
          pending
          active
          suspended
        }

        /// User accounts table
        table users {
          /// Primary identifier
          id uuid @pk @default(gen_random_uuid())

          /// User's email address
          email varchar(255) @unique @not_null

          /// Account status
          status user_status @default('active')

          created_at timestamptz @default(now())

          @index(email)
          @index(created_at, status) using btree
        }

        /// Blog posts
        table posts {
          id uuid @pk @default(gen_random_uuid())
          author_id uuid @fk(users.id) @on_delete(cascade)
          title text @not_null
          content text
          tags text[] @default('{}')

          @unique(author_id, title)
        }
      `

      const ast = parseOrThrow(input)

      // Check enums
      expect(ast.enums).toHaveLength(1)
      expect(ast.enums[0].name).toBe('user_status')
      expect(ast.enums[0].values).toHaveLength(3)

      // Check tables
      expect(ast.tables).toHaveLength(2)

      // Check users table
      const users = ast.tables[0]
      expect(users.name).toBe('users')
      expect(users.description).toBe('User accounts table')
      expect(users.columns).toHaveLength(4)
      expect(users.indexes).toHaveLength(2)

      // Check posts table
      const posts = ast.tables[1]
      expect(posts.name).toBe('posts')
      expect(posts.columns).toHaveLength(5)
      expect(posts.constraints).toHaveLength(1)
    })
  })

  describe('error handling', () => {
    it('returns error for invalid syntax', () => {
      const result = parse('table { }')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBeTruthy()
        expect(result.error.location).toBeTruthy()
      }
    })

    it('returns error for missing closing brace', () => {
      const result = parse('table users { id uuid')
      expect(result.success).toBe(false)
    })

    it('throws with parseOrThrow for invalid input', () => {
      expect(() => parseOrThrow('table { }')).toThrow()
    })
  })

  describe('case insensitivity', () => {
    it('accepts keywords in different cases', () => {
      const input = `
        TABLE Users {
          id UUID @PK @DEFAULT(gen_random_uuid())
        }

        ENUM Status {
          active
        }
      `
      const ast = parseOrThrow(input)
      expect(ast.tables).toHaveLength(1)
      expect(ast.enums).toHaveLength(1)
    })
  })
})
