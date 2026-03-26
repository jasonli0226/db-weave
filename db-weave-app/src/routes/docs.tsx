import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Copy } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/docs')({
  component: DocumentationPage,
})

function DocumentationPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const sectionsRef = useRef<any[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in')
          }
        })
      },
      { threshold: 0.1 },
    )

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const CodeBlock = ({
    children,
    id,
    title,
  }: {
    children: string
    id?: string
    title?: string
  }) => (
    <div className="relative">
      {title && (
        <div className="text-sm font-medium text-gray-600 mb-3">{title}</div>
      )}
      <div className="relative bg-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm overflow-x-auto shadow-sm">
        {id && (
          <button
            onClick={() => copyToClipboard(children, id)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title="Copy to clipboard"
          >
            {copiedId === id ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
        <pre className="whitespace-pre-wrap leading-relaxed">{children}</pre>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current.push(el)
        }}
        className="py-16 lg:py-20 opacity-0"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-thin tracking-tight text-gray-900 mb-6 leading-tight">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Master the DB Weave syntax and build powerful database schemas with
            confidence.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current.push(el)
        }}
        className="py-16 bg-gray-50 opacity-0"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-light text-gray-900 mb-6 tracking-tight">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-3">
                <li>
                  <a
                    href="#basic-syntax"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Basic Syntax
                  </a>
                </li>
                <li>
                  <a
                    href="#tables"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Tables
                  </a>
                </li>
                <li>
                  <a
                    href="#columns"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Columns & Data Types
                  </a>
                </li>
                <li>
                  <a
                    href="#constraints"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Constraints
                  </a>
                </li>
              </ul>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#relationships"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Relationships
                  </a>
                </li>
                <li>
                  <a
                    href="#indexes"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Indexes
                  </a>
                </li>
                <li>
                  <a
                    href="#enums"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Enums
                  </a>
                </li>
                <li>
                  <a
                    href="#examples"
                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                  >
                    Complete Examples
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-20">
          {/* Basic Syntax */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="basic-syntax"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Basic Syntax
            </h2>
            <div className="space-y-8">
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                DB Weave uses a simple, human-readable text format to define
                PostgreSQL database schemas. The syntax is inspired by modern
                configuration languages and focuses on clarity and conciseness.
              </p>

              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">Comments</h3>
                <CodeBlock id="comments">
                  {`// Line comments start with double slashes
/// Documentation comments start with triple slashes
/// These are used to describe tables and columns`}
                </CodeBlock>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Identifiers
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed font-light">
                  Table names, column names, and other identifiers must start
                  with a letter or underscore, followed by letters, numbers, or
                  underscores.
                </p>
              </div>
            </div>
          </section>

          {/* Tables */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="tables"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Tables
            </h2>
            <div className="space-y-8">
              <p className="text-lg text-gray-600 leading-relaxed font-light">
                Tables are the core building blocks of your schema. They contain
                columns, constraints, and indexes.
              </p>

              <CodeBlock id="table-basic" title="Basic Table Definition">
                {`/// User accounts table
table users {
  id integer @pk
  email varchar(255) @unique @not_null
  created_at timestamp @default(now())
}`}
              </CodeBlock>

              <div className="bg-blue-50 p-8 rounded-2xl border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-4 text-lg">
                  Key Points:
                </h4>
                <ul className="text-blue-800 space-y-2 font-light">
                  <li>
                    • Use{' '}
                    <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                      table
                    </code>{' '}
                    keyword followed by the table name
                  </li>
                  <li>
                    • Wrap table contents in curly braces{' '}
                    <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                      &#123; &#125;
                    </code>
                  </li>
                  <li>• Documentation comments describe the table's purpose</li>
                  <li>
                    • Each table member (column, constraint, index) goes on its
                    own line
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Columns */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="columns"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Columns & Data Types
            </h2>
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Column Definition
                </h3>
                <CodeBlock id="column-syntax" title="Column Syntax">
                  {`/// Column description (optional)
column_name data_type @constraint1 @constraint2`}
                </CodeBlock>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Supported Data Types
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Numeric Types
                    </h4>
                    <CodeBlock id="numeric-types">
                      {`smallint, integer, bigint
serial, bigserial, smallserial
decimal(10,2), numeric(10,2)
real, double, float
money`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Text Types
                    </h4>
                    <CodeBlock id="text-types">
                      {`text
varchar(255)
char(10)
character(10)
citext`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Date/Time Types
                    </h4>
                    <CodeBlock id="datetime-types">
                      {`date
timestamp, timestamptz
interval`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Other Types
                    </h4>
                    <CodeBlock id="other-types">
                      {`boolean, bool
uuid
json, jsonb
bytea
inet, cidr
macaddr`}
                    </CodeBlock>
                  </div>
                </div>

                <div className="space-y-6 md:col-span-2">
                  <h3 className="text-xl font-light text-gray-900">
                    Array Types
                  </h3>
                  <CodeBlock id="array-types" title="Array Syntax">
                    {`tags text[]
coordinates integer[][]  // 2D array
matrix float[][][]       // 3D array`}
                  </CodeBlock>
                </div>
              </div>
            </div>
          </section>

          {/* Constraints */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="constraints"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Constraints
            </h2>
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Column Constraints
                </h3>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Primary Key
                    </h4>
                    <CodeBlock id="primary-key">
                      {`id integer @pk
// Or composite primary key at table level
@pk(user_id, role_id)`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Not Null & Unique
                    </h4>
                    <CodeBlock id="not-null-unique">
                      {`email varchar(255) @not_null @unique
username varchar(50) @unique @not_null`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Default Values
                    </h4>
                    <CodeBlock id="defaults">
                      {`// Literal values
status varchar(20) @default('active')
score integer @default(0)
is_enabled boolean @default(true)

// Function calls
created_at timestamp @default(now())
id uuid @default(gen_random_uuid())

// Raw SQL expressions
updated_at timestamp @default(CURRENT_TIMESTAMP)`}
                    </CodeBlock>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 text-lg">
                      Check Constraints
                    </h4>
                    <CodeBlock id="check-constraints">
                      {`age integer @check(age >= 0 AND age <= 120)
email varchar(255) @check(email LIKE '%@%')`}
                    </CodeBlock>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Relationships */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="relationships"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Relationships
            </h2>
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Foreign Keys
                </h3>

                <CodeBlock id="foreign-keys" title="Basic Foreign Key">
                  {`table users {
  id integer @pk
  email varchar(255) @unique
}

table posts {
  id integer @pk
  user_id integer @fk(users.id) @not_null
  title varchar(255)
}`}
                </CodeBlock>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Foreign Key Actions
                </h3>
                <CodeBlock id="fk-actions" title="CASCADE and Other Actions">
                  {`// ON DELETE CASCADE
user_id integer @fk(users.id) @on_delete(cascade)

// ON UPDATE SET NULL
manager_id integer @fk(users.id) @on_update(set_null)

// Available actions: cascade, set_null, set_default, restrict, no_action`}
                </CodeBlock>
              </div>
            </div>
          </section>

          {/* Indexes */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="indexes"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Indexes
            </h2>
            <div className="space-y-6">
              <CodeBlock id="indexes" title="Index Examples">
                {`table users {
  id integer @pk
  email varchar(255) @unique
  first_name varchar(100)
  last_name varchar(100)

  // Simple index
  @index(email)

  // Composite index
  @index(first_name, last_name)

  // Index with specific method
  @index(search_terms) using gin
}

// Available methods: btree, hash, gin, gist, spgist, brin`}
              </CodeBlock>
            </div>
          </section>

          {/* Enums */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="enums"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Enums
            </h2>
            <div className="space-y-6">
              <CodeBlock id="enums-example" title="Enum Definition">
                {`/// User status enumeration
enum user_status {
  /// User account is active
  active
  /// User account is inactive
  inactive
  /// User account is suspended
  suspended
  /// User account is banned
  banned
}

table users {
  id integer @pk
  email varchar(255)
  status user_status @default('active')
}`}
              </CodeBlock>
            </div>
          </section>

          {/* Examples */}
          <section
            ref={(el) => {
              if (el) sectionsRef.current.push(el)
            }}
            id="examples"
            className="opacity-0"
          >
            <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-8 tracking-tight">
              Complete Examples
            </h2>
            <div className="space-y-16">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  Blog System
                </h3>
                <CodeBlock id="blog-example" title="Complete Blog Schema">
                  {`/// User roles enumeration
enum user_role {
  admin
  editor
  author
  subscriber
}

/// User accounts
table users {
  id uuid @pk @default(gen_random_uuid())
  email varchar(255) @unique @not_null
  password_hash varchar(255) @not_null
  first_name varchar(100)
  last_name varchar(100)
  role user_role @default('subscriber')
  is_active boolean @default(true)
  created_at timestamptz @default(now())
  updated_at timestamptz @default(now())

  @index(email)
  @index(role)
}

/// Blog categories
table categories {
  id serial @pk
  name varchar(100) @unique @not_null
  slug varchar(100) @unique @not_null
  description text
  created_at timestamptz @default(now())
}

/// Blog posts
table posts {
  id uuid @pk @default(gen_random_uuid())
  title varchar(255) @not_null
  slug varchar(255) @unique @not_null
  content text
  excerpt text
  author_id uuid @fk(users.id) @not_null @on_delete(restrict)
  category_id integer @fk(categories.id) @on_delete(set_null)
  published_at timestamptz
  created_at timestamptz @default(now())
  updated_at timestamptz @default(now())

  @index(author_id)
  @index(category_id)
  @index(published_at)
  @index(slug)
}

/// Post comments
table comments {
  id uuid @pk @default(gen_random_uuid())
  post_id uuid @fk(posts.id) @not_null @on_delete(cascade)
  author_id uuid @fk(users.id) @not_null @on_delete(cascade)
  parent_id uuid @fk(comments.id) @on_delete(cascade)
  content text @not_null
  created_at timestamptz @default(now())

  @index(post_id)
  @index(author_id)
  @index(parent_id)
}`}
                </CodeBlock>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-light text-gray-900">
                  E-commerce System
                </h3>
                <CodeBlock id="ecommerce-example" title="E-commerce Schema">
                  {`/// Order status enumeration
enum order_status {
  pending
  confirmed
  shipped
  delivered
  cancelled
}

/// Product categories
table categories {
  id serial @pk
  name varchar(100) @not_null
  parent_id integer @fk(categories.id) @on_delete(cascade)
  created_at timestamptz @default(now())
}

/// Products
table products {
  id uuid @pk @default(gen_random_uuid())
  name varchar(255) @not_null
  description text
  price decimal(10,2) @not_null @check(price >= 0)
  category_id integer @fk(categories.id) @on_delete(restrict)
  stock_quantity integer @default(0) @check(stock_quantity >= 0)
  is_active boolean @default(true)
  created_at timestamptz @default(now())

  @index(category_id)
  @index(name) using gin
}

/// Customer orders
table orders {
  id uuid @pk @default(gen_random_uuid())
  customer_email varchar(255) @not_null
  status order_status @default('pending')
  total_amount decimal(10,2) @not_null @check(total_amount >= 0)
  created_at timestamptz @default(now())

  @index(customer_email)
  @index(status)
  @index(created_at)
}

/// Order items
table order_items {
  id uuid @pk @default(gen_random_uuid())
  order_id uuid @fk(orders.id) @not_null @on_delete(cascade)
  product_id uuid @fk(products.id) @not_null @on_delete(restrict)
  quantity integer @not_null @check(quantity > 0)
  unit_price decimal(10,2) @not_null @check(unit_price >= 0)

  @index(order_id)
  @index(product_id)
}`}
                </CodeBlock>
              </div>
            </div>
          </section>
        </div>

        {/* Call to Action */}
        <section
          ref={(el) => {
            if (el) sectionsRef.current.push(el)
          }}
          className="mt-20 opacity-0"
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-12 rounded-2xl border border-blue-100">
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl font-thin text-gray-900 mb-4 tracking-tight">
                Ready to Start Designing?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed font-light">
                Try out the schema editor with these examples or create your own
                from scratch.
              </p>
              <Link to="/editor">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-full transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  Open Schema Editor
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
