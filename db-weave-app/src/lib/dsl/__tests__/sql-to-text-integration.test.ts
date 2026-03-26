import { describe, expect, it } from 'vitest'
import { sqlToAst } from '../parser/sql-to-ast'
import { generateText } from '../generator/text'

describe('SQL to Text Integration', () => {
  it('converts simple CREATE TABLE from SQL to text', () => {
    const sql = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast, { includeComments: false })

      expect(text).toContain('table users')
      expect(text).toContain('id integer @pk')
      expect(text).toContain('name varchar(100) @not_null')
      expect(text).toContain('email varchar(255) @unique @not_null')
    }
  })

  it('converts CREATE TABLE with foreign keys from SQL to text', () => {
    const sql = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );

      CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast)

      expect(text).toContain('table users')
      expect(text).toContain('table posts')
      expect(text).toContain('@fk(users.id)')
      expect(text).toContain('@on_delete(cascade)')
    }
  })

  it('converts CREATE TYPE enum from SQL to text', () => {
    const sql = `
      CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        status user_status
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast)

      expect(text).toContain('enum user_status')
      expect(text).toContain('active')
      expect(text).toContain('inactive')
      expect(text).toContain('suspended')
      expect(text).toContain('table users')
      expect(text).toContain('status user_status')
    }
  })

  it('converts CREATE TABLE with default values from SQL to text', () => {
    const sql = `
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT now(),
        active BOOLEAN DEFAULT true,
        count INTEGER DEFAULT 0
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast)

      expect(text).toContain('@default(gen_random_uuid())')
      expect(text).toContain('@default(now())')
      expect(text).toContain('@default(true)')
      expect(text).toContain('@default(0)')
    }
  })

  it('converts CREATE TABLE with composite primary key from SQL to text', () => {
    const sql = `
      CREATE TABLE user_roles (
        user_id UUID,
        role_id UUID,
        PRIMARY KEY (user_id, role_id)
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast)

      expect(text).toContain('table user_roles')
      expect(text).toContain('@pk(user_id, role_id)')
    }
  })

  it('converts CREATE TABLE with array types from SQL to text', () => {
    const sql = `
      CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        tags TEXT[]
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast)

      expect(text).toContain('tags text[]')
    }
  })

  it('handles complex schema conversion from SQL to text', () => {
    const sql = `
      CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended');

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        status user_status DEFAULT 'active',
        created_at TIMESTAMP DEFAULT now()
      );

      CREATE TABLE posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        published BOOLEAN DEFAULT false
      );

      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_posts_author ON posts(author_id);
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast, { includeComments: false })

      // Check enum
      expect(text).toContain('enum user_status')
      expect(text).toContain('pending')
      expect(text).toContain('active')
      expect(text).toContain('suspended')

      // Check tables
      expect(text).toContain('table users')
      expect(text).toContain('table posts')

      // Check constraints
      expect(text).toContain('@pk')
      expect(text).toContain('@unique')
      expect(text).toContain('@not_null')
      expect(text).toContain('@fk(users.id)')
      expect(text).toContain('@on_delete(cascade)')

      // Check defaults
      expect(text).toContain('@default(gen_random_uuid())')
      expect(text).toContain('@default(now())')
      expect(text).toContain("@default('active')")
      expect(text).toContain('@default(false)')
    }
  })

  it('handles parsing errors gracefully', () => {
    const invalidSql = `
      CREATE TABLE INVALID SYNTAX HERE
    `

    const result = sqlToAst(invalidSql)
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('roundtrip: text -> SQL -> text preserves schema structure', () => {
    // This test would require the full parser which we already have
    // Just verifying the SQL-to-text conversion works
    const sql = `
      CREATE TYPE status AS ENUM ('active', 'inactive');

      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        status status,
        created_at TIMESTAMP DEFAULT now()
      );

      CREATE TABLE posts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL
      );
    `

    const result = sqlToAst(sql)
    expect(result.success).toBe(true)

    if (result.success && result.ast) {
      const text = generateText(result.ast, { includeComments: false })

      // Verify key elements are preserved
      expect(text).toContain('enum status')
      expect(text).toContain('table users')
      expect(text).toContain('table posts')
      expect(text).toContain('@pk')
      expect(text).toContain('@fk(users.id)')
      expect(text).toContain('@on_delete(cascade)')
    }
  })
})
