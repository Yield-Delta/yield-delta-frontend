/**
 * Logger utility for frontend application
 * Provides environment-aware logging with different levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
}

class Logger {
  private config: LoggerConfig;
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    this.config = {
      // Only enable logging in development mode by default
      enabled: process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG === 'true',
      level: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    const prefix = this.context ? `[${timestamp}] [${level.toUpperCase()}] [${this.context}]` : `[${timestamp}] [${level.toUpperCase()}]`;
    return [prefix, message, ...args];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(...this.formatMessage('error', message, errorDetails, ...args));
    }
  }

  // Create a child logger with additional context
  child(childContext: string): Logger {
    const fullContext = this.context ? `${this.context}:${childContext}` : childContext;
    return new Logger(fullContext);
  }
}

// Export factory function for creating loggers
export const createLogger = (context: string): Logger => new Logger(context);

// Export default logger instance
export const logger = new Logger();