const SECRET_KEY =
  /password|secret|token|authorization|cookie|database_url|api_key|credential|session/i;
const POSTGRES_URL = /postgres(?:ql)?:\/\/[^\s'"]+/gi;

export type LogLevel = "info" | "error";

export type LogFields = Record<string, unknown>;

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(POSTGRES_URL, "postgres://[redacted]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }
  if (typeof value === "object" && value !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = SECRET_KEY.test(key) ? "[redacted]" : redact(item);
    }
    return redacted;
  }
  return value;
}

export function createLogger(
  service: string,
  write: (line: string) => void = (line) => {
    console.log(line);
  },
) {
  function record(level: LogLevel, message: string, fields: LogFields = {}): void {
    const entry = {
      time: new Date().toISOString(),
      level,
      service,
      message: redact(message),
      ...(redact(fields) as LogFields),
    };
    write(JSON.stringify(entry));
  }

  return {
    info(message: string, fields?: LogFields): void {
      record("info", message, fields);
    },
    error(message: string, fields?: LogFields): void {
      record("error", message, fields);
    },
  };
}

export function clientErrorLog(error: unknown): { code: "internal_error"; detail: string } {
  const message = error instanceof Error ? error.message : "unknown error";
  return {
    code: "internal_error",
    detail: String(redact(message)),
  };
}
