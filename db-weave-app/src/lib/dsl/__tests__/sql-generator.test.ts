import { describe, expect, it } from 'vitest'
import { parseOrThrow } from '../parser'
import { generateSql } from '../generator/sql'

describe('SQL Generator', () => {
  describe('enums', () => {
    it('generates CREATE TYPE for enum', () => {
      const ast = parseOrThrow(`
        enum status {
          pending
          active
          archived
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain(
        "CREATE TYPE status AS ENUM ('pending', 'active', 'archived');",
      )
    })

    it('generates enum with doc comment', () => {
      const ast = parseOrThrow(`
        /// User account status
        enum user_status {
          pending
          active
        }
      `)

      const sql = generateSql(ast, { includeComments: true })

      expect(sql).toContain('-- User account status')
      expect(sql).toContain(
        "CREATE TYPE user_status AS ENUM ('pending', 'active');",
      )
    })

    it('generates DROP TYPE when includeDropStatements is true', () => {
      const ast = parseOrThrow(`
        enum status {
          active
        }
      `)

      const sql = generateSql(ast, {
        includeDropStatements: true,
        includeComments: false,
      })

      expect(sql).toContain('DROP TYPE IF EXISTS status CASCADE;')
    })
  })

  describe('tables', () => {
    it('generates simple CREATE TABLE', () => {
      const ast = parseOrThrow(`
        table users {
          id uuid
          name text
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('CREATE TABLE users (')
      expect(sql).toContain('id UUID')
      expect(sql).toContain('name TEXT')
    })

    it('generates table with doc comment', () => {
      const ast = parseOrThrow(`
        /// User accounts
        table users {
          id uuid
        }
      `)

      const sql = generateSql(ast, { includeComments: true })

      expect(sql).toContain('-- User accounts')
      expect(sql).toContain("COMMENT ON TABLE users IS 'User accounts';")
    })

    it('generates column comments', () => {
      const ast = parseOrThrow(`
        table users {
          /// Primary identifier
          id uuid
        }
      `)

      const sql = generateSql(ast, { includeComments: true })

      expect(sql).toContain(
        "COMMENT ON COLUMN users.id IS 'Primary identifier';",
      )
    })

    it('generates DROP TABLE when includeDropStatements is true', () => {
      const ast = parseOrThrow(`
        table users {
          id uuid
        }
      `)

      const sql = generateSql(ast, {
        includeDropStatements: true,
        includeComments: false,
      })

      expect(sql).toContain('DROP TABLE IF EXISTS users CASCADE;')
    })
  })

  describe('data types', () => {
    it('generates simple types', () => {
      const ast = parseOrThrow(`
        table test {
          a uuid
          b text
          c integer
          d boolean
          e jsonb
          f bytea
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('a UUID')
      expect(sql).toContain('b TEXT')
      expect(sql).toContain('c INTEGER')
      expect(sql).toContain('d BOOLEAN')
      expect(sql).toContain('e JSONB')
      expect(sql).toContain('f BYTEA')
    })

    it('generates parametrized types', () => {
      const ast = parseOrThrow(`
        table test {
          a varchar(255)
          b numeric(10, 2)
          c char(1)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('a VARCHAR(255)')
      expect(sql).toContain('b NUMERIC(10, 2)')
      expect(sql).toContain('c CHAR(1)')
    })

    it('generates array types', () => {
      const ast = parseOrThrow(`
        table test {
          tags text[]
          matrix integer[][]
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('tags TEXT[]')
      expect(sql).toContain('matrix INTEGER[][]')
    })

    it('generates timestamptz correctly', () => {
      const ast = parseOrThrow(`
        table test {
          created_at timestamptz
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('created_at TIMESTAMP WITH TIME ZONE')
    })

    it('generates custom types (enums)', () => {
      const ast = parseOrThrow(`
        table test {
          status user_status
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('status USER_STATUS')
    })
  })

  describe('column constraints', () => {
    it('generates PRIMARY KEY', () => {
      const ast = parseOrThrow(`
        table users {
          id uuid @pk
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('id UUID PRIMARY KEY')
    })

    it('generates UNIQUE', () => {
      const ast = parseOrThrow(`
        table users {
          email text @unique
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('email TEXT UNIQUE')
    })

    it('generates NOT NULL', () => {
      const ast = parseOrThrow(`
        table users {
          name text @not_null
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('name TEXT NOT NULL')
    })

    it('generates multiple constraints', () => {
      const ast = parseOrThrow(`
        table users {
          email varchar(255) @unique @not_null
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('email VARCHAR(255) UNIQUE NOT NULL')
    })

    it('generates DEFAULT with function call', () => {
      const ast = parseOrThrow(`
        table users {
          id uuid @default(gen_random_uuid())
          created_at timestamptz @default(now())
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('id UUID DEFAULT gen_random_uuid()')
      expect(sql).toContain('created_at TIMESTAMP WITH TIME ZONE DEFAULT now()')
    })

    it('generates DEFAULT with literals', () => {
      const ast = parseOrThrow(`
        table test {
          active boolean @default(true)
          count integer @default(0)
          name text @default('unknown')
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('active BOOLEAN DEFAULT TRUE')
      expect(sql).toContain('count INTEGER DEFAULT 0')
      expect(sql).toContain("name TEXT DEFAULT 'unknown'")
    })

    it('generates CHECK constraint', () => {
      const ast = parseOrThrow(`
        table users {
          age integer @check(age >= 0)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('age INTEGER CHECK (age >= 0)')
    })
  })

  describe('foreign keys', () => {
    it('generates REFERENCES', () => {
      const ast = parseOrThrow(`
        table posts {
          user_id uuid @fk(users.id)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('user_id UUID REFERENCES users(id)')
    })

    it('generates ON DELETE action', () => {
      const ast = parseOrThrow(`
        table posts {
          user_id uuid @fk(users.id) @on_delete(cascade)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('REFERENCES users(id) ON DELETE CASCADE')
    })

    it('generates ON UPDATE action', () => {
      const ast = parseOrThrow(`
        table posts {
          user_id uuid @fk(users.id) @on_update(set_null)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('REFERENCES users(id) ON UPDATE SET NULL')
    })

    it('generates both ON DELETE and ON UPDATE', () => {
      const ast = parseOrThrow(`
        table posts {
          user_id uuid @fk(users.id) @on_delete(cascade) @on_update(restrict)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('ON DELETE CASCADE')
      expect(sql).toContain('ON UPDATE RESTRICT')
    })

    it('generates all FK actions correctly', () => {
      const actions = [
        { dsl: 'cascade', sql: 'CASCADE' },
        { dsl: 'set_null', sql: 'SET NULL' },
        { dsl: 'set_default', sql: 'SET DEFAULT' },
        { dsl: 'restrict', sql: 'RESTRICT' },
        { dsl: 'no_action', sql: 'NO ACTION' },
      ]

      for (const { dsl, sql: expected } of actions) {
        const ast = parseOrThrow(`
          table posts {
            user_id uuid @fk(users.id) @on_delete(${dsl})
          }
        `)
        const sql = generateSql(ast, { includeComments: false })
        expect(sql).toContain(`ON DELETE ${expected}`)
      }
    })
  })

  describe('table-level constraints', () => {
    it('generates composite PRIMARY KEY', () => {
      const ast = parseOrThrow(`
        table user_roles {
          user_id uuid
          role_id uuid
          @pk(user_id, role_id)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('PRIMARY KEY (user_id, role_id)')
    })

    it('generates composite UNIQUE', () => {
      const ast = parseOrThrow(`
        table posts {
          author_id uuid
          title text
          @unique(author_id, title)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('UNIQUE (author_id, title)')
    })

    it('generates table-level CHECK', () => {
      const ast = parseOrThrow(`
        table products {
          min_price integer
          max_price integer
          @check(min_price <= max_price)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('CHECK (min_price <= max_price)')
    })
  })

  describe('indexes', () => {
    it('generates single column index', () => {
      const ast = parseOrThrow(`
        table users {
          email text
          @index(email)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('CREATE INDEX idx_users_email ON users (email);')
    })

    it('generates multi-column index', () => {
      const ast = parseOrThrow(`
        table users {
          first_name text
          last_name text
          @index(first_name, last_name)
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain(
        'CREATE INDEX idx_users_first_name_last_name ON users (first_name, last_name);',
      )
    })

    it('generates index with non-default method', () => {
      const ast = parseOrThrow(`
        table users {
          data jsonb
          @index(data) using gin
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain(
        'CREATE INDEX idx_users_data ON users USING GIN (data);',
      )
    })

    it('generates all index methods', () => {
      const methods = ['hash', 'gin', 'gist', 'spgist', 'brin']

      for (const method of methods) {
        const ast = parseOrThrow(`
          table test {
            col text
            @index(col) using ${method}
          }
        `)
        const sql = generateSql(ast, { includeComments: false })
        expect(sql).toContain(`USING ${method.toUpperCase()}`)
      }
    })

    it('btree index omits USING clause', () => {
      const ast = parseOrThrow(`
        table test {
          col text
          @index(col) using btree
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).not.toContain('USING')
    })
  })

  describe('schema name', () => {
    it('prefixes table names with schema', () => {
      const ast = parseOrThrow(`
        table users {
          id uuid
        }
      `)

      const sql = generateSql(ast, {
        schemaName: 'public',
        includeComments: false,
      })

      expect(sql).toContain('CREATE TABLE public.users')
    })

    it('prefixes enum names with schema', () => {
      const ast = parseOrThrow(`
        enum status {
          active
        }
      `)

      const sql = generateSql(ast, {
        schemaName: 'app',
        includeComments: false,
      })

      expect(sql).toContain('CREATE TYPE app.status')
    })
  })

  describe('complete schema', () => {
    it('generates full schema in correct order', () => {
      const ast = parseOrThrow(`
        /// User status
        enum user_status {
          pending
          active
        }

        /// Users table
        table users {
          id uuid @pk @default(gen_random_uuid())
          email varchar(255) @unique @not_null
          status user_status @default('active')
          created_at timestamptz @default(now())

          @index(email)
        }

        /// Posts table
        table posts {
          id uuid @pk @default(gen_random_uuid())
          author_id uuid @fk(users.id) @on_delete(cascade)
          title text @not_null

          @unique(author_id, title)
        }
      `)

      const sql = generateSql(ast, { includeComments: true })

      // Check order: enums before tables, indexes after tables
      const enumPos = sql.indexOf('CREATE TYPE user_status')
      const usersPos = sql.indexOf('CREATE TABLE users')
      const postsPos = sql.indexOf('CREATE TABLE posts')
      const indexPos = sql.indexOf('CREATE INDEX')

      expect(enumPos).toBeLessThan(usersPos)
      expect(usersPos).toBeLessThan(postsPos)
      expect(postsPos).toBeLessThan(indexPos)

      // Check content
      expect(sql).toContain(
        "CREATE TYPE user_status AS ENUM ('pending', 'active');",
      )
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
      expect(sql).toContain('email VARCHAR(255) UNIQUE NOT NULL')
      expect(sql).toContain('REFERENCES users(id) ON DELETE CASCADE')
      expect(sql).toContain('UNIQUE (author_id, title)')
      expect(sql).toContain('CREATE INDEX idx_users_email ON users (email);')
    })
  })

  describe('identifier escaping', () => {
    it('escapes reserved words', () => {
      const ast = parseOrThrow(`
        table users {
          order integer
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain('"order" INTEGER')
    })
  })

  describe('string escaping', () => {
    it('escapes single quotes in strings', () => {
      const ast = parseOrThrow(`
        table test {
          name text @default('it''s a test')
        }
      `)

      const sql = generateSql(ast, { includeComments: false })

      expect(sql).toContain("DEFAULT 'it''s a test'")
    })
  })
})
