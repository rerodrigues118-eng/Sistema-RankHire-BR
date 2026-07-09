const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (msg: string, data?: unknown) => {
    if (isDev) console.info('[INFO]', msg, data ?? '');
  },
  warn: (msg: string, data?: unknown) => {
    if (isDev) console.warn('[WARN]', msg, data ?? '');
  },
  error: (msg: string, error?: unknown) => {
    console.error('[ERROR]', msg, error instanceof Error ? error.message : error ?? '');
  },
};
