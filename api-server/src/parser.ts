// Simple parser for DB Weave schema format
// This is a lightweight parser for the backend ORM generators

export interface ParsedColumn {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  unique: boolean;
  default?: string;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface ParsedTable {
  name: string;
  columns: ParsedColumn[];
}

export interface ParsedSchema {
  tables: ParsedTable[];
}

export function parseDbWeaveSchema(schemaText: string): ParsedSchema {
  const tables: ParsedTable[] = [];

  // Split by table declarations
  const tableRegex = /table\s+(\w+)\s*\{([^}]*)\}/g;
  let match;

  while ((match = tableRegex.exec(schemaText)) !== null) {
    const tableName = match[1];
    const tableContent = match[2];

    const columns: ParsedColumn[] = [];

    // Split by lines and parse columns
    const lines = tableContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"));

    for (const line of lines) {
      // Skip comments and empty lines
      if (!line || line.startsWith("//") || line.startsWith("///")) continue;

      // Parse column: name type @constraints
      const columnMatch = line.match(
        /^(\w+)\s+(\w+(?:\([^)]*\))?)(?:\s+(.+))?$/,
      );
      if (columnMatch) {
        const [, name, type, constraintsStr] = columnMatch;

        const column: ParsedColumn = {
          name,
          type,
          primaryKey: false,
          notNull: false,
          unique: false,
        };

        // Parse constraints
        if (constraintsStr) {
          const constraints = constraintsStr.split("@").filter((c) => c.trim());

          for (const constraint of constraints) {
            const trimmed = constraint.trim();

            if (trimmed === "pk") {
              column.primaryKey = true;
            } else if (trimmed === "not_null") {
              column.notNull = true;
            } else if (trimmed === "unique") {
              column.unique = true;
            } else if (trimmed.startsWith("default(")) {
              const defaultMatch = trimmed.match(/default\((.*)\)/);
              if (defaultMatch) {
                column.default = defaultMatch[1];
              }
            } else if (trimmed.startsWith("fk(")) {
              const fkMatch = trimmed.match(/fk\(([^.]+)\.([^)]+)\)/);
              if (fkMatch) {
                column.foreignKey = {
                  table: fkMatch[1],
                  column: fkMatch[2],
                };
              }
            }
          }
        }

        columns.push(column);
      }
    }

    tables.push({
      name: tableName,
      columns,
    });
  }

  return { tables };
}
