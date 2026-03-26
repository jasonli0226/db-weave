import { describe, expect, it } from 'vitest'
import { parse } from '../parser'
import { generateText } from '../generator/text'

describe('Text Generator', () => {
  it('generates text from parsed schema', () => {
    const input = `
      table users {
        id integer @pk
        name varchar(100) @not_null
        email varchar(255) @unique @not_null
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast, { includeComments: false })

      expect(text).toContain('table users')
      expect(text).toContain('id integer @pk')
      expect(text).toContain('name varchar(100) @not_null')
      expect(text).toContain('email varchar(255) @unique @not_null')
    }
  })

  it('generates text with comments', () => {
    const input = `
      /// User accounts table
      table users {
        /// Primary identifier
        id integer @pk
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast, { includeComments: true })

      expect(text).toContain('/// User accounts table')
      expect(text).toContain('/// Primary identifier')
    }
  })

  it('generates text for enums', () => {
    const input = `
      enum status {
        active
        inactive
        suspended
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast)

      expect(text).toContain('enum status')
      expect(text).toContain('active')
      expect(text).toContain('inactive')
      expect(text).toContain('suspended')
    }
  })

  it('generates text for foreign keys', () => {
    const input = `
      table posts {
        user_id integer @fk(users.id) @on_delete(cascade) @on_update(restrict)
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast)

      expect(text).toContain('@fk(users.id)')
      expect(text).toContain('@on_delete(cascade)')
      expect(text).toContain('@on_update(restrict)')
    }
  })

  it('generates text for indexes', () => {
    const input = `
      table users {
        email text
        created_at timestamp
        @index(email)
        @index(created_at) using gin
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast)

      expect(text).toContain('@index(email)')
      expect(text).toContain('@index(created_at) using gin')
    }
  })

  it('generates text for default values', () => {
    const input = `
      table users {
        id uuid @default(gen_random_uuid())
        created_at timestamp @default(now())
        active boolean @default(true)
        count integer @default(0)
        name text @default('unknown')
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast)

      expect(text).toContain('@default(gen_random_uuid())')
      expect(text).toContain('@default(now())')
      expect(text).toContain('@default(true)')
      expect(text).toContain('@default(0)')
      expect(text).toContain("@default('unknown')")
    }
  })

  it('generates text for composite constraints', () => {
    const input = `
      table user_roles {
        user_id uuid
        role_id uuid
        @pk(user_id, role_id)
        @unique(user_id, role_id)
      }
    `

    const parseResult = parse(input)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const text = generateText(parseResult.ast)

      expect(text).toContain('@pk(user_id, role_id)')
      expect(text).toContain('@unique(user_id, role_id)')
    }
  })

  it('roundtrip: text -> AST -> text preserves structure', () => {
    const originalInput = `/// User status enum
enum user_status {
  /// User is pending verification
  pending
  active
  suspended
}

/// Users table
table users {
  /// Primary identifier
  id uuid @pk @default(gen_random_uuid())
  email varchar(255) @unique @not_null
  status user_status @default('active')
  created_at timestamp @default(now())
  @index(email)
  @index(created_at, status) using btree
}

table posts {
  id uuid @pk @default(gen_random_uuid())
  author_id uuid @fk(users.id) @on_delete(cascade)
  title text @not_null
  content text
  @unique(author_id, title)
}`

    const parseResult = parse(originalInput)
    expect(parseResult.success).toBe(true)

    if (parseResult.success) {
      const generatedText = generateText(parseResult.ast, {
        includeComments: true,
      })

      // Parse the generated text again
      const secondParseResult = parse(generatedText)
      expect(secondParseResult.success).toBe(true)

      // Verify key elements are preserved
      expect(generatedText).toContain('enum user_status')
      expect(generatedText).toContain('table users')
      expect(generatedText).toContain('table posts')
      expect(generatedText).toContain('@pk')
      expect(generatedText).toContain('@fk(users.id)')
      expect(generatedText).toContain('@on_delete(cascade)')
      expect(generatedText).toContain('@default(gen_random_uuid())')
    }
  })
})
