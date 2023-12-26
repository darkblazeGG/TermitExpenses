const log4js = require('log4js')
const logger = log4js.getLogger('interface')

const port = 3000

module.exports = [
    port,
    () => logger.info('HTTP server is listning on port', port)
]
