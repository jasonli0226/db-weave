import { parseDbWeaveSchema } from "../parser";

export class SequelizeGenerator {
  private parsedSchema: any;

  constructor(dbWeaveText: string) {
    this.parsedSchema = parseDbWeaveSchema(dbWeaveText);
  }

  generate(): string {
    let sequelizeCode = `const { DataTypes } = require('sequelize');\n\n`;
    sequelizeCode += `module.exports = (sequelize) => {\n`;

    if (this.parsedSchema.tables) {
      for (const table of this.parsedSchema.tables) {
        sequelizeCode += `  const ${table.name} = sequelize.define('${table.name}', {\n`;

        if (table.columns) {
          for (const column of table.columns) {
            const sequelizeType = this.mapToSequelizeType(column.type);
            const options = this.getSequelizeOptions(column);

            sequelizeCode += `    ${column.name}: {\n`;
            sequelizeCode += `      type: ${sequelizeType}${options}`;
            sequelizeCode += `    },\n`;
          }
        }

        sequelizeCode += `  }, {\n`;
        sequelizeCode += `    tableName: '${table.name}',\n`;
        sequelizeCode += `    timestamps: false\n`;
        sequelizeCode += `  });\n\n`;
      }
    }

    sequelizeCode += `};\n\n`;
    sequelizeCode += `// Return all models\n`;
    sequelizeCode += `module.exports.models = {\n`;

    if (this.parsedSchema.tables) {
      for (const table of this.parsedSchema.tables) {
        sequelizeCode += `  ${table.name},\n`;
      }
    }

    sequelizeCode += `};\n`;

    return sequelizeCode;
  }

  private mapToSequelizeType(dbType: string): string {
    const typeMap: { [key: string]: string } = {
      integer: "DataTypes.INTEGER",
      bigint: "DataTypes.BIGINT",
      decimal: "DataTypes.DECIMAL",
      numeric: "DataTypes.DECIMAL",
      real: "DataTypes.REAL",
      double: "DataTypes.DOUBLE",
      smallint: "DataTypes.SMALLINT",
      serial: "DataTypes.INTEGER",
      bigserial: "DataTypes.BIGINT",
      varchar: "DataTypes.STRING",
      char: "DataTypes.CHAR",
      text: "DataTypes.TEXT",
      boolean: "DataTypes.BOOLEAN",
      bool: "DataTypes.BOOLEAN",
      date: "DataTypes.DATE",
      timestamp: "DataTypes.DATE",
      timestamptz: "DataTypes.DATE",
      json: "DataTypes.JSON",
      jsonb: "DataTypes.JSONB",
      uuid: "DataTypes.UUID",
      bytea: "DataTypes.BLOB",
    };

    return typeMap[dbType.toLowerCase()] || "DataTypes.STRING";
  }

  private getSequelizeOptions(column: any): string {
    const options: string[] = [];

    if (column.primaryKey) {
      options.push("primaryKey: true");
    }
    if (column.notNull) {
      options.push("allowNull: false");
    }
    if (column.unique) {
      options.push("unique: true");
    }
    if (column.default) {
      options.push(`defaultValue: ${column.default}`);
    }

    return options.length > 0
      ? ",\n" + options.map((opt) => `      ${opt}`).join(",\n")
      : "";
  }
}
