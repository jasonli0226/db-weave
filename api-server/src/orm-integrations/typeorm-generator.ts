import { parseDbWeaveSchema } from "../parser";

export class TypeORMGenerator {
  private parsedSchema: any;

  constructor(dbWeaveText: string) {
    this.parsedSchema = parseDbWeaveSchema(dbWeaveText);
  }

  generate(): string {
    let typeormCode = `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';\n\n`;

    if (this.parsedSchema.tables) {
      for (const table of this.parsedSchema.tables) {
        typeormCode += `@Entity()\n`;
        typeormCode += `export class ${this.toClassName(table.name)} {\n`;

        if (table.columns) {
          for (const column of table.columns) {
            const columnDecorator = this.getColumnDecorator(column);
            const propertyType = this.mapToTypeScriptType(column.type);

            typeormCode += `  ${columnDecorator}\n`;
            typeormCode += `  ${column.name}: ${propertyType};\n\n`;
          }
        }

        typeormCode += `}\n\n`;
      }
    }

    return typeormCode;
  }

  private toClassName(tableName: string): string {
    return tableName.charAt(0).toUpperCase() + tableName.slice(1);
  }

  private getColumnDecorator(column: any): string {
    let decorator = "";

    if (column.primaryKey) {
      decorator = "@PrimaryGeneratedColumn()";
    } else {
      decorator = "@Column(";
      const options: string[] = [];

      if (column.notNull) {
        options.push("nullable: false");
      }
      if (column.unique) {
        options.push("unique: true");
      }

      if (options.length > 0) {
        decorator += "{ " + options.join(", ") + " }";
      }
      decorator += ")";
    }

    return decorator;
  }

  private mapToTypeScriptType(dbType: string): string {
    const typeMap: { [key: string]: string } = {
      integer: "number",
      bigint: "number",
      decimal: "number",
      numeric: "number",
      real: "number",
      double: "number",
      smallint: "number",
      serial: "number",
      bigserial: "number",
      varchar: "string",
      char: "string",
      text: "string",
      boolean: "boolean",
      bool: "boolean",
      date: "Date",
      timestamp: "Date",
      timestamptz: "Date",
      json: "any",
      jsonb: "any",
      uuid: "string",
      bytea: "Buffer",
    };

    return typeMap[dbType.toLowerCase()] || "any";
  }
}
