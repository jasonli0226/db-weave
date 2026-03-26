# db-weave

A web application for managing and designing PostgreSQL databases with a custom DSL (Domain-Specific Language).

## Project Status

### Completed ✅

#### Phase 1: Core DSL Parser

- [x] Custom text format (DSL) grammar design
- [x] Peggy grammar implementation (`schema.peggy`)
- [x] AST type definitions
- [x] Parser with error handling
- [x] Data type utilities (PostgreSQL types)
- [x] 40+ parser tests

#### Phase 2: SQL Generator

- [x] Enum generation (`CREATE TYPE ... AS ENUM`)
- [x] Table generation (`CREATE TABLE`)
- [x] Column constraints (PK, FK, UNIQUE, NOT NULL, DEFAULT, CHECK)
- [x] Table-level constraints (composite PK, composite UNIQUE)
- [x] Index generation (`CREATE INDEX` with btree, gin, gist, etc.)
- [x] Comments generation (`COMMENT ON TABLE/COLUMN`)
- [x] Schema prefix support
- [x] DROP statements option
- [x] SQL generator tests

### In Progress 🚧

#### Phase 3: ERD Visualization

- [x] React Flow nodes/edges generator
- [x] Mermaid ERD generator
- [x] Interactive diagram component
- [x] ERD export (PNG, PDF)

### Completed ✅

#### Phase 4: Bidirectional Conversion

- [x] SQL → DSL parser (using node-sql-parser)
- [x] AST → DSL serializer (pretty-print)
- [x] Import SQL modal

#### Phase 5: AI Integration

- [x] OpenAI-powered schema generation from natural language
- [x] Schema improvement suggestions
- [x] Schema explanation and documentation
- [x] Server functions with TanStack Start
- [x] AI Assistant panel in editor

#### Phase 6: UI Components

- [x] Schema editor with split view
- [x] Live preview with debounced updates
- [x] Export/Import functionality (SQL, PNG, PDF)
- [x] Interactive ERD with React Flow

### Planned 📋

#### Phase 7: Advanced Features

- [ ] Schema validation (FK reference validation, type compatibility)
- [ ] Schema templates and presets
- [ ] Real-time collaboration
- [ ] Database connection and introspection
- [ ] Version control and migrations
- [ ] Performance analytics and recommendations

---

## DSL Syntax

```
/// Doc comments for tables/columns/enums
table users {
  id          uuid         @pk @default(gen_random_uuid())
  email       varchar(255) @unique @not_null
  status      user_status  @default('active')
  tags        text[]       @default('{}')
  created_at  timestamptz  @default(now())

  @index(email)
  @index(created_at, status) using gin
  @check(length(email) > 5)
}

table posts {
  id          uuid  @pk @default(gen_random_uuid())
  author_id   uuid  @fk(users.id) @on_delete(cascade)
  title       text  @not_null

  @unique(author_id, title)
}

enum user_status {
  pending   /// Awaiting verification
  active    /// Active account
  suspended
}
```

### Supported Features

| Feature          | Syntax                                                            |
| ---------------- | ----------------------------------------------------------------- |
| Primary Key      | `@pk`                                                             |
| Foreign Key      | `@fk(table.column)`                                               |
| Unique           | `@unique`                                                         |
| Not Null         | `@not_null`                                                       |
| Default          | `@default(value)` or `@default(function())`                       |
| Check            | `@check(expression)`                                              |
| On Delete        | `@on_delete(cascade\|set_null\|set_default\|restrict\|no_action)` |
| On Update        | `@on_update(...)`                                                 |
| Composite PK     | `@pk(col1, col2)`                                                 |
| Composite Unique | `@unique(col1, col2)`                                             |
| Index            | `@index(col1, col2) using btree\|hash\|gin\|gist\|spgist\|brin`   |
| Doc Comments     | `/// description`                                                 |
| Line Comments    | `// ignored`                                                      |

### Supported Data Types

- **Numeric**: integer, bigint, smallint, serial, bigserial, numeric(p,s), real, double
- **Text**: text, varchar(n), char(n), citext
- **Boolean**: boolean
- **Date/Time**: date, time, timetz, timestamp, timestamptz, interval
- **UUID**: uuid
- **JSON**: json, jsonb
- **Binary**: bytea
- **Arrays**: any_type[]
- **Network**: inet, cidr, macaddr
- **Geometric**: point, line, box, circle, polygon
- **Custom**: enum types

---

## Project Structure

```
src/lib/dsl/
├── index.ts                    # Public API exports
├── types.ts                    # AST type definitions
├── parser/
│   └── index.ts                # Parser wrapper (parse, parseOrThrow)
├── grammar/
│   ├── schema.peggy            # Peggy grammar (570 lines)
│   └── generated/
│       └── parser.js           # Generated parser (git-ignored)
├── generator/
│   ├── index.ts                # Generator exports
│   └── sql.ts                  # AST → PostgreSQL DDL
├── utils/
│   ├── data-types.ts           # PostgreSQL type metadata
│   └── constants.ts            # Reserved words, keywords
└── __tests__/
    ├── parser.test.ts          # Parser tests
    └── sql-generator.test.ts   # SQL generator tests
```

---

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set up Environment Variables

For AI features, you'll need an OpenAI API key:

```bash
# Copy the example environment file
cp .env.example .env.local

# Add your OpenAI API key to .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Build and Run

```bash
# Build grammar (required before first run)
pnpm grammar:build

# Run development server
pnpm dev

# Run tests
pnpm test

# Watch tests
pnpm test:watch
```

## Scripts

| Script               | Description                                   |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Start dev server on port 3000                 |
| `pnpm build`         | Build grammar + Vite build + TypeScript check |
| `pnpm test`          | Run all tests                                 |
| `pnpm test:watch`    | Run tests in watch mode                       |
| `pnpm grammar:build` | Compile Peggy grammar to parser               |
| `pnpm grammar:watch` | Watch and recompile grammar                   |
| `pnpm lint`          | Run ESLint                                    |
| `pnpm format`        | Run Prettier                                  |
| `pnpm check`         | Format + lint fix                             |

---

## Usage Example

```typescript
import { parseOrThrow, generateSql } from './lib/dsl'

const schema = `
  table users {
    id uuid @pk @default(gen_random_uuid())
    email varchar(255) @unique @not_null
  }
`

// Parse DSL to AST
const ast = parseOrThrow(schema)

// Generate SQL
const sql = generateSql(ast, {
  includeComments: true,
  includeDropStatements: false,
})

console.log(sql)
// CREATE TABLE users (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   email VARCHAR(255) UNIQUE NOT NULL
// );
```

---

## Tech Stack

- **Frontend**: React 19, Vite 7, TanStack Start
- **Backend**: Server functions with Nitro
- **AI**: OpenAI GPT-4, TanStack AI SDK
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Parser**: Peggy 5 (PEG parser generator)
- **Testing**: Vitest, Testing Library
- **Language**: TypeScript 5.7 (strict mode)

---

## Next Steps (Resume From Here)

To continue development:

1. **Run tests** to verify everything works:

   ```bash
   pnpm grammar:build && pnpm test
   ```

2. **Next phase**: ERD Generator (Phase 3)
   - Create `src/lib/dsl/generator/react-flow.ts`
   - Generate nodes for tables, edges for FK relationships
   - Create interactive diagram component

3. **Alternative next steps**:
   - Mermaid ERD generator for quick static diagrams
   - Schema validator for FK reference checking
   - Editor component with Monaco/CodeMirror
