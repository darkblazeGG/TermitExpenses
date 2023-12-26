const page = require('./page')
const setExpenses = require('./setExpenses')

function lounch(app) {
    page(app)
    setExpenses(app)
}

module.exports = lounch
