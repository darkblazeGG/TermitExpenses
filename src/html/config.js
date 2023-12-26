const log4js = require('log4js')
const logger = log4js.getLogger('interface')

const port = 3001

module.exports = [
    port,
    'localhost',
    () => logger.info('HTML interface is listning on port', port)
]
