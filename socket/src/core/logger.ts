/**
 * Structured logger for the realtime service.
 * Wraps console with level-based filtering and structured output.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel];
}

function format(level: LogLevel, context: Record<string, unknown>, msg: string): string {
    return JSON.stringify({
        ts: new Date().toISOString(),
        level,
        msg,
        ...context,
    });
}

export const logger = {
    debug(context: Record<string, unknown>, msg: string): void {
        if (shouldLog('debug')) console.debug(format('debug', context, msg));
    },
    info(context: Record<string, unknown>, msg: string): void {
        if (shouldLog('info')) console.info(format('info', context, msg));
    },
    warn(context: Record<string, unknown>, msg: string): void {
        if (shouldLog('warn')) console.warn(format('warn', context, msg));
    },
    error(context: Record<string, unknown>, msg: string): void {
        if (shouldLog('error')) console.error(format('error', context, msg));
    },
};
