const log4js = require('log4js')
const logger = log4js.getLogger('interface')

const port = 3002

module.exports = [
    port,
    'localhost',
    () => logger.info('Calculate interface is listning on port', port)
]
