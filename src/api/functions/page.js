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
        request(`http://localhost:3001/${func}${Object.keys(query).length ? '?' + serialize(query) : ''}`, {
            method: method.toLocaleUpperCase(),
            body: JSON.stringify(form),
            headers
        }, (error, response, body) => {
            if (error || response.statusCode != 200)
                return reject(error || response.statusCode)
            return resolve(body)
        })
    })
}

function page(app) {
    app.get('/', (request, response) => {
        redirect({ func: '', method: 'get', query: request.query, headers: request.headers }).then(result => response.status(200).sendFile(result)).catch(error => response.status(500).json(error))
    })
    app.get('/script.js', (request, response) => {
        redirect({ func: 'script.js', method: 'get', query: request.query, headers: request.headers }).then(result => response.status(200).sendFile(result)).catch(error => response.status(500).json(error))
    })
    app.get('/style.css', (request, response) => {
        redirect({ func: 'style.css', method: 'get', query: request.query, headers: request.headers }).then(result => response.status(200).sendFile(result)).catch(error => response.status(500).json(error))
    })
}

module.exports = page
