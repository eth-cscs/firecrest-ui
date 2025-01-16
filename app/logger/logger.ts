import pino from 'pino'
// configs
import loggerConfig from '~/configs/logger.config'

const logger = pino({
  level: loggerConfig.loggingLevel,
})

export default logger
