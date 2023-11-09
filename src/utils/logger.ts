import { createLogger, format, transports } from 'winston'
import path from 'path'

const logsPath = path.resolve(
  __dirname,
  '..',
  'logs',
);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'crawler' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: path.resolve(logsPath, 'errors'), level: 'error' }),
    new transports.File({ filename: path.resolve(logsPath, 'logs') })
  ]
});


export default logger