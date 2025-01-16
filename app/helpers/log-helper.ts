// logger
import logger from '~/logger/logger'
// config
import base from '~/configs/base.config'
import loggerConfig from '~/configs/logger.config'

const getHttpJsonData = ({ message, request, extraInfo }: any) => {
  return {
    message,
    appVersion: process.env.APP_VERSION,
    timestamp: new Date(),
    loggingLevel: loggerConfig.loggingLevel,
    environment: base.environment,
    serviceName: base.serviceName,
    request: {
      originalUrl: request.originalUrl,
      path: request.path,
      contentType: request.headers.get('Content-Type'),
    },
    ...extraInfo,
  }
}

const logInfoHttp = ({ message, request, extraInfo }: any) => {
  logger.info(getHttpJsonData({ message, request, extraInfo }))
}

export { logInfoHttp }
