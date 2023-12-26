const express = require('express')
require('./loggerConfigurer')

const log4js = require('log4js')
const logger = log4js.getLogger('default')

const app = express()
app.use(require('body-parser').json())
app.use(require('body-parser').urlencoded({ extended: true }))

const functions = require('./functions')

const config = require('./config')

function lounch() {
    functions(app)

    app.listen(...config)
}

lounch()
