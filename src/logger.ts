// src/logger.ts
// Sets up a Winston logger writing to console + timestamped log file.

import winston from 'winston';
import path from 'path';
import { LOGS_DIR } from './config';

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .slice(0, 19);

const logFile = path.join(LOGS_DIR, `run_${timestamp}.log`);

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase().padEnd(8)}] ${message}`
    )
  ),
  transports: [
    // Console: INFO and above
    new winston.transports.Console({
      level: 'info',
    }),
    // File: DEBUG and above
    new winston.transports.File({
      filename: logFile,
      level: 'debug',
    }),
  ],
});

export default logger;
