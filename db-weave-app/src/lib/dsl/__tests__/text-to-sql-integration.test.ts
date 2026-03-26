import { describe, expect, it } from 'vitest'
import { parse } from '../parser'
import { generateSql } from '../generator'

describe('Text to SQL Integration', () => {
  it('converts simple schema from text to SQL', () => {
    const textSchema = `
      table users {
        id integer @pk
        name varchar(100) @not_null
        email varchar(255) @unique @not_null
      }
    `

    const parseResult = parse(textSchema)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const sql = generateSql(parseResult.ast, {
        includeComments: false,
        includeDropStatements: false,
      })

      expect(sql).toContain('CREATE TABLE')
      expect(sql).toContain('users')
      expect(sql).toContain('id')
      expect(sql).toContain('INTEGER')
      expect(sql).toContain('PRIMARY KEY')
      expect(sql).toContain('email')
      expect(sql).toContain('VARCHAR(255)')
      expect(sql).toContain('UNIQUE')
      expect(sql).toContain('NOT NULL')
    }
  })

  it('converts schema with foreign keys from text to SQL', () => {
    const textSchema = `
      table users {
        id integer @pk
        name text @not_null
      }

      table posts {
        id integer @pk
        user_id integer @fk(users.id) @on_delete(cascade)
        title text @not_null
      }
    `

    const parseResult = parse(textSchema)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const sql = generateSql(parseResult.ast)

      expect(sql).toContain('CREATE TABLE users')
      expect(sql).toContain('CREATE TABLE posts')
      expect(sql).toContain('REFERENCES users(id)')
      expect(sql).toContain('ON DELETE CASCADE')
    }
  })

  it('converts schema with enums from text to SQL', () => {
    const textSchema = `
      enum user_status {
        active
        inactive
        suspended
      }

      table users {
        id integer @pk
        status user_status
      }
    `

    const parseResult = parse(textSchema)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const sql = generateSql(parseResult.ast)

      expect(sql).toContain('CREATE TYPE user_status AS ENUM')
      expect(sql).toContain("'active'")
      expect(sql).toContain("'inactive'")
      expect(sql).toContain("'suspended'")
      expect(sql).toContain('CREATE TABLE users')
    }
  })

  it('converts schema with indexes from text to SQL', () => {
    const textSchema = `
      table users {
        email text @unique
        created_at timestamp
        @index(email)
        @index(created_at) using btree
      }
    `

    const parseResult = parse(textSchema)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const sql = generateSql(parseResult.ast)

      expect(sql).toContain('CREATE INDEX')
      expect(sql).toContain('email')
      expect(sql).toContain('created_at')
    }
  })

  it('converts schema with default values from text to SQL', () => {
    const textSchema = `
      table users {
        id uuid @pk @default(gen_random_uuid())
        created_at timestamp @default(now())
        active boolean @default(true)
        count integer @default(0)
      }
    `

    const parseResult = parse(textSchema)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const sql = generateSql(parseResult.ast)

      expect(sql).toContain('DEFAULT gen_random_uuid()')
      expect(sql).toContain('DEFAULT now()')
      expect(sql).toContain('DEFAULT TRUE')
      expect(sql).toContain('DEFAULT 0')
    }
  })

  it('converts complete schema from text to SQL', () => {
    const textSchema = `
      /// User status enum
      enum user_status {
        pending
        active
        suspended
      }

      /// Users table
      table users {
        /// Primary identifier
        id uuid @pk @default(gen_random_uuid())

        /// User email
        email varchar(255) @unique @not_null

        status user_status @default('active')
        created_at timestamp @default(now())

        @index(email)
        @index(created_at, status) using btree
      }

      /// Posts table
      table posts {
        id uuid @pk @default(gen_random_uuid())
        author_id uuid @fk(users.id) @on_delete(cascade)
        title text @not_null
        content text
        published boolean @default(false)

        @unique(author_id, title)
      }
    `

    const parseResult = parse(textSchema)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const sql = generateSql(parseResult.ast, {
        includeComments: true,
        includeDropStatements: false,
      })

      // Check enum generation
      expect(sql).toContain('CREATE TYPE user_status AS ENUM')

      // Check table creation
      expect(sql).toContain('CREATE TABLE users')
      expect(sql).toContain('CREATE TABLE posts')

      // Check comments
      expect(sql).toContain('User status enum')
      expect(sql).toContain('Users table')

      // Check constraints
      expect(sql).toContain('PRIMARY KEY')
      expect(sql).toContain('UNIQUE')
      expect(sql).toContain('NOT NULL')
      expect(sql).toContain('REFERENCES users(id)')
      expect(sql).toContain('ON DELETE CASCADE')

      // Check defaults
      expect(sql).toContain('DEFAULT gen_random_uuid()')
      expect(sql).toContain('DEFAULT now()')

      // Check indexes (btree is default, so USING clause is omitted)
      expect(sql).toContain('CREATE INDEX')
    }
  })

  it('handles parse errors gracefully', () => {
    const invalidSchema = `
      table {
        id integer
      }
    `

    const parseResult = parse(invalidSchema)
    expect(parseResult.success).toBe(false)

    if (!parseResult.success) {
      expect(parseResult.error).toBeDefined()
      expect(parseResult.error.message).toBeTruthy()
    }
  })
})
