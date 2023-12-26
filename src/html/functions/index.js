function lounch(app) {
    app.get('/', (_, response) => {
        response.send(__dirname + '/page.html')
    })
    app.get('/script.js', (_, response) => {
        response.send(__dirname + '/script.js')
    })
    app.get('/style.css', (_, response) => {
        response.send(__dirname + '/style.css')
    })
}

module.exports = lounch
