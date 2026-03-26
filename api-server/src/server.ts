import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import rateLimit, { type Options } from "express-rate-limit";
import ormRoutes from "./routes/orm";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

// Environment validation
if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY is required");
  process.exit(1);
}

// Allowed origins for CORS (configure based on deployment)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    // In production, you might want to be stricter
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Helper to create a rate limit key generator that uses userId primarily
// and falls back to normalized IP for unauthenticated requests
const createKeyGenerator = (): Options["keyGenerator"] => {
  return (req) => {
    const auth = getAuth(req);
    if (auth?.userId) {
      return auth.userId;
    }
    // For unauthenticated requests, use IP with basic normalization
    // Strip IPv6 prefix from IPv4-mapped addresses (::ffff:)
    const ip = req.ip || "anonymous";
    const normalizedIp = ip.replace(/^::ffff:/, "");
    return normalizedIp;
  };
};

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window per IP
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID for rate limiting when authenticated
  keyGenerator: createKeyGenerator(),
  // Disable IPv6 validation since we use userId as primary key
  validate: { keyGeneratorIpFallback: false },
});

// Stricter rate limit for AI endpoints (costly operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per user
  message: {
    success: false,
    error: "AI rate limit exceeded. Please wait before making more requests.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(),
  validate: { keyGeneratorIpFallback: false },
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "100kb" })); // Limit request body size
app.use(clerkMiddleware());
app.use(apiLimiter);

// Input validation schemas
const generateSchemaInput = z.object({
  prompt: z.string().min(1, "Prompt is required").max(5000),
  includeExamples: z.boolean().default(true),
});

const improveSchemaInput = z.object({
  currentSchema: z.string().min(1, "Current schema is required").max(50000),
  improvements: z
    .string()
    .min(1, "Improvement instructions are required")
    .max(2000),
});

const explainSchemaInput = z.object({
  schema: z.string().min(1, "Schema is required").max(50000),
});

// API request types
interface AIRequest {
  action: "generate" | "improve" | "explain" | "suggest";
  data: unknown;
}

interface AIResponse {
  success: boolean;
  schema?: string;
  explanation?: string;
  suggestions?: string;
  error?: string;
}

// Helper function to clean AI output
function cleanSchemaOutput(text: string): string {
  // Remove code fences if present
  let cleaned = text.trim();

  // Remove opening code fence (```sql, ```, etc.)
  cleaned = cleaned.replace(
    /^```(?:sql|postgresql|postgres|pgsql|dbweave)?\s*\n?/i,
    "",
  );

  // Remove closing code fence
  cleaned = cleaned.replace(/\n?```\s*$/, "");

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

// System prompts
const SCHEMA_GENERATION_PROMPT = `You are a database schema expert. Generate PostgreSQL database schemas using the DB Weave custom text format.

CRITICAL RULES - MUST FOLLOW:
1. Return ONLY the schema code - NO explanatory text before or after
2. DO NOT wrap output in markdown code fences or code blocks
3. Start directly with enum or table keyword - nothing else
4. Foreign key actions MUST be on the same line as @fk: @fk(table.column) @on_delete(cascade) @on_update(cascade)
5. Comments are ONLY allowed BEFORE tables/columns, NEVER inside table blocks before @index or other constraints
6. Do NOT add comments inside table definitions except before column declarations

DB Weave Syntax Rules:
- Use "table" keyword followed by table name and curly braces
- Column syntax: "column_name data_type @constraints"
- Available constraints: @pk, @unique, @not_null, @default(value), @fk(table.column), @check(condition)
- Foreign key with actions: @fk(table.column) @on_delete(action) @on_update(action) (ALL on same line!)
- FK actions: cascade | set_null | set_default | restrict | no_action
- Indexes: @index(column1, column2) or @index(column) using method (btree, hash, gin, gist, spgist, brin)
- Enums: enum name { value1 value2 value3 } (space-separated, NO commas)
- Comments: // for line comments OUTSIDE tables, /// for documentation BEFORE tables/columns only
- Data types: serial, integer, bigint, varchar(n), text, boolean, timestamp, timestamptz, uuid, jsonb, decimal(p,s), etc.

CORRECT Examples:

enum user_status {
  pending
  active
  inactive
}

// User accounts
table users {
  user_id serial @pk
  email varchar(255) @unique @not_null
  status user_status @default(pending)
  created_at timestamptz @default(now())
  @index(email)
}

// Blog posts with FK actions on same line
table posts {
  post_id serial @pk
  user_id integer @fk(users.user_id) @on_delete(cascade) @on_update(cascade) @not_null
  title varchar(255) @not_null
  @index(user_id)
}

INCORRECT Examples (DO NOT DO THIS):
❌ table posts {
     user_id integer @fk(users.user_id)
     /// Index comment inside table
     @index(user_id)
     @on_delete(cascade)
   }

Always include:
1. Proper primary keys
2. Foreign key relationships WITH actions on same line
3. Appropriate constraints
4. Useful indexes
5. Comments ONLY before tables/columns
6. Realistic defaults

Return ONLY the schema code with NO additional text or explanations.`;

const SCHEMA_IMPROVEMENT_PROMPT = `You are a database optimization expert. Improve the given database schema based on the user's requirements.

CRITICAL RULES - MUST FOLLOW:
1. Return ONLY the schema code - NO explanatory text before or after
2. DO NOT wrap output in markdown code fences or code blocks
3. Start directly with enum or table keyword - nothing else
4. Foreign key actions MUST be on the same line as @fk: @fk(table.column) @on_delete(cascade) @on_update(cascade)
5. Comments are ONLY allowed BEFORE tables/columns, NEVER inside table blocks before @index or other constraints
6. Do NOT add comments inside table definitions except before column declarations

Focus on:
1. Performance optimizations (indexes, data types)
2. Data integrity (constraints, relationships)
3. Best practices (normalization, naming conventions)
4. Security considerations
5. Maintainability

Return ONLY the improved schema in DB Weave format with NO additional explanatory text.`;

const SCHEMA_EXPLANATION_PROMPT = `You are a database expert. Explain the given database schema in a clear, educational way.

Provide:
1. Overview of the database purpose
2. Description of each table and its role
3. Explanation of relationships between tables
4. Notable constraints and their purposes
5. Performance considerations (indexes, data types)
6. Best practices demonstrated in the schema

Be clear and educational, suitable for developers learning database design.`;

const SCHEMA_SUGGESTION_PROMPT = `You are a database optimization expert. Analyze the given schema and suggest specific improvements.

Focus on:
1. Performance optimizations
2. Data integrity issues
3. Missing constraints or relationships
4. Indexing opportunities
5. Normalization issues
6. Security considerations

Provide specific, actionable recommendations.`;

// Create router for /db-weave prefix
const router = Router();

// Protected AI routes
router.post(
  "/api/ai",
  requireAuth(),
  aiLimiter,
  async (req: Request, res: Response<AIResponse>) => {
    try {
      const { action, data } = req.body as AIRequest;

      // Log user for audit trail (optional)
      const auth = getAuth(req);
      const userId = auth && "userId" in auth ? auth.userId : "unknown";
      console.log(`AI request from user: ${userId}, action: ${action}`);

      let result;
      switch (action) {
        case "generate": {
          const generateData = generateSchemaInput.parse(data);
          result = await generateText({
            model: openai(OPENAI_MODEL),
            system: SCHEMA_GENERATION_PROMPT,
            prompt: `Generate a database schema for: ${generateData.prompt}

${generateData.includeExamples ? "Include realistic example data in comments where helpful." : ""}

CRITICAL: Return ONLY the schema code starting directly with enum/table declarations.
DO NOT wrap in code fences - no markdown code blocks with triple backticks.
DO NOT include any introductory text, explanations, or concluding remarks.
DO NOT write "Here is the schema:" or similar phrases.
DO NOT add explanatory text after the schema.
Start your response with 'enum' or 'table' or '//' comment.

Requirements:
- Use proper DB Weave syntax
- Foreign key actions on same line: @fk(table.column) @on_delete(cascade) @on_update(cascade)
- Comments ONLY before tables/columns, NOT inside table blocks before @index
- Include all necessary tables and relationships
- Add appropriate constraints and indexes
- Follow PostgreSQL best practices`,
            temperature: 0.7,
          });
          return res.json({
            success: true,
            schema: cleanSchemaOutput(result.text),
          });
        }

        case "improve": {
          const improveData = improveSchemaInput.parse(data);
          result = await generateText({
            model: openai(OPENAI_MODEL),
            system: SCHEMA_IMPROVEMENT_PROMPT,
            prompt: `Current schema:
\`\`\`
${improveData.currentSchema}
\`\`\`

Improvement requirements:
${improveData.improvements}

CRITICAL: Return ONLY the improved schema code.
DO NOT wrap in code fences - no markdown code blocks with triple backticks.
DO NOT include explanatory text before or after the schema.
Start directly with enum or table keyword.
Foreign key actions MUST be on same line as @fk.
Comments ONLY before tables/columns, NOT inside table blocks.`,
            temperature: 0.3,
          });
          return res.json({
            success: true,
            schema: cleanSchemaOutput(result.text),
          });
        }

        case "explain": {
          const explainData = explainSchemaInput.parse(data);
          result = await generateText({
            model: openai(OPENAI_MODEL),
            system: SCHEMA_EXPLANATION_PROMPT,
            prompt: `Please explain this database schema:
\`\`\`
${explainData.schema}
\`\`\`

Provide a comprehensive explanation that would be helpful for understanding the database design.`,
            temperature: 0.3,
          });
          return res.json({ success: true, explanation: result.text });
        }

        case "suggest": {
          const suggestData = explainSchemaInput.parse(data);
          result = await generateText({
            model: openai(OPENAI_MODEL),
            system: SCHEMA_SUGGESTION_PROMPT,
            prompt: `Analyze this schema and suggest improvements:
\`\`\`
${suggestData.schema}
\`\`\`

Provide specific recommendations for improving this schema.`,
            temperature: 0.3,
          });
          return res.json({ success: true, suggestions: result.text });
        }

        default:
          return res
            .status(400)
            .json({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("AI API error:", error);

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: `Validation error: ${error.issues.map((e: z.core.$ZodIssue) => e.message).join(", ")}`,
        });
      }

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  },
);

// ORM integration routes
router.use("/api/orm", ormRoutes);

// Health check (public)
router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount router with /db-weave prefix
app.use("/db-weave", router);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      error: "Origin not allowed",
    });
  }

  // Handle Clerk auth errors
  if (err.name === "ClerkError" || err.message.includes("Unauthorized")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`🤖 AI API Server running on http://localhost:${PORT}/db-weave`);
  console.log(
    `🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing"}`,
  );
  console.log(
    `🔐 Clerk: ${process.env.CLERK_SECRET_KEY ? "✅ Configured" : "❌ Missing"}`,
  );
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});
