const fs = require('fs')
const XLSX = require('xlsx')
const cliProgress = require('cli-progress')
const colors = require('ansi-colors')

const log4js = require('log4js')
const logger = log4js.getLogger('default')

const newOrder = require('./newOrder')

const root = "D:\\ТЕРМИТ\\ЗАКАЗЫ"

const Second = 1000
const Minute = 60 * Second
const Hour = 60 * Minute
const Day = 24 * Hour

function getTimeZoneOffset(date, timeZone) {
    let iso = date.toLocaleString('en-CA', { timeZone, hour12: false }).replace(', ', 'T')
    iso += '.' + date.getMilliseconds().toString().padStart(3, '0')
    const lie = new Date(iso + 'Z')
    return -(lie - date) / 60 / 1000
}

function getMinutes(minutes) {
    if (minutes === 1)
        return 'минута'
    if (minutes < 5)
        return 'минуты'
    return 'минут'
}

function getSeconds(seconds) {
    if (seconds % 10 === 1)
        return 'секунда'
    if (seconds % 10 < 5 && seconds % 10 && (seconds > 20 || seconds < 10))
        return 'секунды'
    return 'секунд'
}

function round(num, round = 0, func = Math.round) {
    return func(num * 10 ** round) / 10 ** round
}

function setExpenses(app) {
    app.post('/setExpenses', async (request, response) => {
        let orders = []
        fs.readdirSync(root).map(costumer => {
            if (fs.lstatSync(root + '\\' + costumer).isDirectory())
                fs.readdirSync(root + '\\' + costumer).filter(year => year >= new Date().getFullYear()).map(year => {
                    if (fs.lstatSync(root + '\\' + costumer + '\\' + year).isDirectory())
                        fs.readdirSync(root + '\\' + costumer + '\\' + year).map(order => {
                            orders.push({
                                dir: root + '\\' + costumer + '\\' + year + '\\' + order,
                                updatedAt: fs.lstatSync(root + '\\' + costumer + '\\' + year + '\\' + order).mtime
                            })
                        })
                    else
                        orders.push({
                            dir: root + '\\' + costumer + '\\' + year,
                            updatedAt: fs.lstatSync(root + '\\' + costumer + '\\' + year).mtime
                        })
                })
            else
                orders.push({
                    dir: root + '\\' + costumer,
                    updatedAt: fs.lstatSync(root + '\\' + costumer).mtime
                })
        })
        orders = orders.filter(({ dir }) => !dir.includes('~') && dir.includes('.xlsx'))
        logger.info('Orders directory read')
        let progress = new cliProgress.SingleBar({
            format: 'Получаю номера |' + colors.cyan('{bar}') + '| {percentage}% {remaining} || {value}/{total} прочитано || Читаю файл {filename}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        })
        progress.start(orders.length, 0)
        let start = +new Date()
        orders = orders.map((order, index) => {
            progress.increment()
            const now = +new Date()
            const remaining = new Date((now - start) / (index + 1) * (orders.length - index - 1) + getTimeZoneOffset(new Date()) * Minute)
            progress.update({
                filename: order.dir,
                remaining: `${remaining.getHours() ? `${remaining.getHours()} часов ` : ''}${remaining.getMinutes() ? `${remaining.getMinutes()} ${getMinutes(remaining.getMinutes())} ` : ''}${remaining.getSeconds() ? `${remaining.getSeconds()} ${getSeconds(remaining.getSeconds())}` : ''}`
            })
            if (!fs.existsSync(order.dir))
                return
            const ws = XLSX.readFile(order.dir)

            if (!ws.Sheets['ЗАКАЗ-НАРЯД'])
                return
            if (ws.Sheets['ЗАКАЗ-НАРЯД']?.['N7']?.v && typeof ws.Sheets['ЗАКАЗ-НАРЯД']?.['N7']?.v === 'string' && ws.Sheets['ЗАКАЗ-НАРЯД']?.['N7']?.v?.match(/\d+/))
                order.number = JSON.parse(ws.Sheets['ЗАКАЗ-НАРЯД']?.['N7']?.v?.match(/\d+/)?.[0])
            else if (ws.Sheets['ЗАКАЗ-НАРЯД']?.['M7']?.v && typeof ws.Sheets['ЗАКАЗ-НАРЯД']?.['M7']?.v === 'string' && ws.Sheets['ЗАКАЗ-НАРЯД']?.['M7']?.v?.match(/\d+/))
                order.number = JSON.parse(ws.Sheets['ЗАКАЗ-НАРЯД']?.['M7']?.v?.match(/\d+/)?.[0])
            if (!order.number)
                return

            return order
        }).filter(order => order && request.body.orders.includes(order.number))
        orders.sort((a, b) => +b.updatedAt - +a.updatedAt)
        orders = orders.filter(({ number }, index, array) => array.findIndex(order => order.number === number) === index)
        progress.stop()
        logger.info('Read orders filtered')
        progress = new cliProgress.SingleBar({
            format: 'Преобразовываю заказы |' + colors.cyan('{bar}') + '| {percentage}% {remaining} || {value}/{total} прочитано || Читаю файл {filename}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        })
        progress.start(orders.length, 0)
        start = +new Date()
        orders = orders.map(({ dir }, index) => newOrder(dir, index, orders.length, progress, start))
        const publishers = []
        for (let order of orders)
            publishers.push(...order)
        progress.stop()
        logger.info('Read orders transformated')

        const expenses = {
            polyester: {
                square: round(publishers.filter(({ milling }) => !milling).map(({ square }) => square).reduce((a, b) => a + b, 0), 2),
                expenses: request.body.polyester,
                average: round(request.body.polyester / (publishers.filter(({ milling }) => !milling).map(({ square }) => square).reduce((a, b) => a + b, 0) || 1), 2)
            },
            polyurethane: {
                square: round(publishers.filter(({ milling }) => milling).map(({ square }) => square).reduce((a, b) => a + b, 0), 2),
                expenses: request.body.polyurethane,
                average: round(request.body.polyurethane / (publishers.filter(({ milling }) => milling).map(({ square }) => square).reduce((a, b) => a + b, 0) || 1), 2)
            },
            insulator: {
                square: round(publishers.filter(({ milling }) => milling).map(({ square }) => square).reduce((a, b) => a + b, 0), 2),
                expenses: request.body.insulator,
                average: round(request.body.insulator / (publishers.filter(({ milling }) => milling).map(({ square }) => square).reduce((a, b) => a + b, 0) || 1), 2)
            }
        }

        let message = []
        message.push(`Затраты полиэфира: Квадратов: ${expenses.polyester.square}. Затраты: ${expenses.polyester.expenses}гр. Средний расход: ${expenses.polyester.average}гр/кв`)
        message.push(`Затраты полиуретана: Квадратов: ${expenses.polyurethane.square}. Затраты: ${expenses.polyurethane.expenses}гр. Средний расход: ${expenses.polyurethane.average}гр/кв`)
        message.push(`Затраты изолятора: Квадратов: ${expenses.insulator.square}. Затраты: ${expenses.insulator.expenses}гр. Средний расход: ${expenses.insulator.average}гр/кв`)

        fs.writeFileSync(__dirname + '/../../expenses/' + new Date().toLocaleDateString() + '.txt', message.join('\r\n\r\n'))
        response.status(200).json(message)
    })
}

module.exports = setExpenses
