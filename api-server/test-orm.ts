// Simple test for ORM integration
import { parseDbWeaveSchema } from './src/parser';
import { PrismaSchemaGenerator } from './src/orm-integrations/prisma-generator';

const testSchema = `table users {
  id uuid @pk
  name text @not_null
  email varchar(255) @unique
  created_at timestamptz @default(now())
}

table posts {
  id uuid @pk
  user_id uuid @fk(users.id)
  title text @not_null
  content text
}`;

console.log('Testing parser...');
try {
  const parsed = parseDbWeaveSchema(testSchema);
  console.log('Parsed schema:', JSON.stringify(parsed, null, 2));

  console.log('\nTesting Prisma generator...');
  const generator = new PrismaSchemaGenerator(testSchema);
  const prismaCode = generator.generate();
  console.log('Generated Prisma schema:');
  console.log(prismaCode);

} catch (error) {
  console.error('Error:', error);
}