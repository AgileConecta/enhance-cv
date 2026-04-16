type LogLevel = "info" | "error";

type LogContext = {
  requestId?: string;
  route?: string;
  userId?: string;
  sourceType?: string;
  status?: number;
  error?: unknown;
  [key: string]: unknown;
};

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return error;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
    error: context.error ? serializeError(context.error) : undefined,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.info(line);
}

export function logInfo(message: string, context?: LogContext) {
  write("info", message, context);
}

export function logError(message: string, context?: LogContext) {
  write("error", message, context);
}
