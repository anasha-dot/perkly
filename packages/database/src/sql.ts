export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let dollarTag: string | null = null;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index] ?? "";
    const next = sql[index + 1] ?? "";

    if (!inSingleQuote && dollarTag === null && character === "-" && next === "-") {
      const lineEnd = sql.indexOf("\n", index);
      const comment = lineEnd === -1 ? sql.slice(index) : sql.slice(index, lineEnd + 1);
      current += comment;
      index = lineEnd === -1 ? sql.length : lineEnd;
      continue;
    }

    if (dollarTag === null && character === "'") {
      if (inSingleQuote && next === "'") {
        current += "''";
        index += 1;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += character;
      continue;
    }

    if (!inSingleQuote && character === "$") {
      const match = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(index));
      if (match !== null) {
        const tag = match[0];
        if (dollarTag === null || dollarTag === tag) {
          dollarTag = dollarTag === null ? tag : null;
          current += tag;
          index += tag.length - 1;
          continue;
        }
      }
    }

    if (!inSingleQuote && dollarTag === null && character === ";") {
      pushStatement(statements, current);
      current = "";
      continue;
    }

    current += character;
  }

  pushStatement(statements, current);
  return statements;
}

function pushStatement(statements: string[], raw: string): void {
  const statement = raw.trim();
  if (statement.length === 0) {
    return;
  }
  const withoutComments = statement
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
  if (withoutComments.length > 0) {
    statements.push(statement);
  }
}
