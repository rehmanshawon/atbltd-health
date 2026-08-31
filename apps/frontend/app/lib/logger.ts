type LogContext = Record<string, unknown>;

type LogEntry = {
  level: 'error' | 'warn' | 'info';
  message: string;
  context?: LogContext;
};

function write(entry: LogEntry) {
  const output = JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString(),
  });

  if (entry.level === 'error') {
    console.error(output);
  } else if (entry.level === 'warn') {
    console.warn(output);
  } else {
    console.info(output);
  }
}

export const logger = {
  error(message: string, context?: LogContext) {
    write({ level: 'error', message, context });
  },
  warn(message: string, context?: LogContext) {
    write({ level: 'warn', message, context });
  },
  info(message: string, context?: LogContext) {
    write({ level: 'info', message, context });
  },
};
