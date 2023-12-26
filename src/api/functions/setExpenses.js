const request = require('request')

function serialize(object) {
    let query = []
    for (let property of Object.keys(object))
        if (object.hasOwnProperty(property))
            query.push(`${encodeURIComponent(property)}=${encodeURIComponent(object[property])}`)
    return query.join('&')
}

function redirect({ func, method, form, query, headers }) {
    return new Promise((resolve, reject) => {
        request(`http://localhost:3002/${func}${Object.keys(query).length ? '?' + serialize(query) : ''}`, {
            method: method.toLocaleUpperCase(),
            body: JSON.stringify(form),
            headers
        }, (error, response, body) => {
            if (error || response.statusCode != 200)
                return reject(error || response.statusCode)
            return resolve(JSON.parse(body))
        })
    })
}

function setExpenses(app) {
    app.post('/setExpenses', (request, response) => {
        redirect({ func: 'setExpenses', method: 'post', query: request.query, form: request.body, headers: request.headers }).then(result => response.status(200).json(result)).catch(error => response.status(500).json(error))
    })
}

module.exports = setExpenses
