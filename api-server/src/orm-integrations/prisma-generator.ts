import { parseDbWeaveSchema } from "../parser";

export class PrismaSchemaGenerator {
  private parsedSchema: any;

  constructor(dbWeaveText: string) {
    this.parsedSchema = parseDbWeaveSchema(dbWeaveText);
  }

  generate(): string {
    let prismaSchema = `// This is a Prisma schema file,\n`;
    prismaSchema += `// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n`;
    prismaSchema += `generator client {\n`;
    prismaSchema += `  provider = "prisma-client-js"\n`;
    prismaSchema += `}\n\n`;
    prismaSchema += `datasource db {\n`;
    prismaSchema += `  provider = "postgresql"\n`;
    prismaSchema += `  url      = env("DATABASE_URL")\n`;
    prismaSchema += `}\n\n`;

    // Generate models from parsed schema
    if (this.parsedSchema.tables) {
      for (const table of this.parsedSchema.tables) {
        prismaSchema += `model ${table.name} {\n`;

        // Add columns
        if (table.columns) {
          for (const column of table.columns) {
            const prismaType = this.mapToPrismaType(column.type);
            prismaSchema += `  ${column.name}`;
            if (!column.foreignKey) {
              prismaSchema += `  ${prismaType}`;
            }

            // Add constraints
            if (column.primaryKey) {
              prismaSchema += ` @id`;
            }
            if (column.unique) {
              prismaSchema += ` @unique`;
            }
            if (column.default) {
              prismaSchema += ` @default(${column.default})`;
            }
            if (column.foreignKey) {
              // Add relation field for foreign keys
              const relatedTable = column.foreignKey.table;
              prismaSchema += ` ${relatedTable} @relation(fields: [${column.name}], references: [${column.foreignKey.column}])`;
            }
            prismaSchema += `\n`;
          }
        }

        // Add relation fields for foreign keys pointing TO this table
        const relations = this.getRelationsForTable(
          table.name,
          this.parsedSchema.tables,
        );
        for (const relation of relations) {
          prismaSchema += `  ${relation.fieldName} ${relation.type}\n`;
        }

        prismaSchema += `}\n\n`;
      }
    }

    return prismaSchema;
  }

  private pluralize(word: string): string {
    // Simple pluralization - can be improved
    if (
      word.endsWith("s") ||
      word.endsWith("sh") ||
      word.endsWith("ch") ||
      word.endsWith("x") ||
      word.endsWith("z")
    ) {
      return word + "es";
    } else if (word.endsWith("y") && !/[aeiou]y$/.test(word)) {
      return word.slice(0, -1) + "ies";
    } else {
      return word + "s";
    }
  }

  private getRelationsForTable(tableName: string, allTables: any[]): any[] {
    const relations: any[] = [];

    for (const table of allTables) {
      if (table.columns) {
        for (const column of table.columns) {
          if (column.foreignKey && column.foreignKey.table === tableName) {
            // This column references the current table
            const relatedTableName = table.name;
            const fieldName = this.pluralize(relatedTableName);
            const type = `${relatedTableName}[]`;
            relations.push({ fieldName, type });
          }
        }
      }
    }

    return relations;
  }

  private mapToPrismaType(dbType: string): string {
    const typeMap: { [key: string]: string } = {
      integer: "Int",
      bigint: "BigInt",
      decimal: "Decimal",
      numeric: "Decimal",
      real: "Float",
      double: "Float",
      smallint: "Int",
      serial: "Int @default(autoincrement())",
      bigserial: "Int @default(autoincrement())",
      varchar: "String",
      char: "String",
      text: "String",
      boolean: "Boolean",
      bool: "Boolean",
      date: "DateTime",
      timestamp: "DateTime",
      timestamptz: "DateTime",
      json: "Json",
      jsonb: "Json",
      uuid: "String",
      bytea: "Bytes",
    };

    return typeMap[dbType.toLowerCase()] || "String";
  }
}
