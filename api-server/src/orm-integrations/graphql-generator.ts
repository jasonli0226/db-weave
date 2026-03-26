import { parseDbWeaveSchema } from "../parser";

export class GraphQLGenerator {
  private parsedSchema: any;

  constructor(dbWeaveText: string) {
    this.parsedSchema = parseDbWeaveSchema(dbWeaveText);
  }

  generate(): string {
    let graphqlSchema = `type Query {\n`;

    if (this.parsedSchema.tables) {
      for (const table of this.parsedSchema.tables) {
        graphqlSchema += `  ${table.name}s: [${table.name}!]\n`;
        graphqlSchema += `  ${table.name}(id: ID!): ${table.name}\n`;
      }
    }

    graphqlSchema += `}\n\n`;

    if (this.parsedSchema.tables) {
      for (const table of this.parsedSchema.tables) {
        graphqlSchema += `type ${table.name} {\n`;

        if (table.columns) {
          for (const column of table.columns) {
            const graphQLType = this.mapToGraphQLType(column.type);
            graphqlSchema += `  ${column.name}: ${graphQLType}\n`;
          }
        }

        graphqlSchema += `}\n\n`;
      }
    }

    return graphqlSchema;
  }

  private mapToGraphQLType(dbType: string): string {
    const typeMap: { [key: string]: string } = {
      integer: "Int",
      bigint: "BigInt",
      decimal: "Float",
      numeric: "Float",
      real: "Float",
      double: "Float",
      smallint: "Int",
      serial: "Int",
      bigserial: "BigInt",
      varchar: "String",
      char: "String",
      text: "String",
      boolean: "Boolean",
      bool: "Boolean",
      date: "String",
      timestamp: "String",
      timestamptz: "String",
      json: "JSON",
      jsonb: "JSON",
      uuid: "ID",
      bytea: "String",
    };

    return typeMap[dbType.toLowerCase()] || "String";
  }
}
