const XLSX = require('xlsx')

const Сarpentry = [/р/, /п/, /с/, /б/]
const Type = [/прямой/, /фрез/, /f/, /фас кл/, /фасад клиента/]

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

function newOrder(file, index, max, bar, start) {
    let workbook
    const now = +new Date()
    const remaining = new Date((now - start) / (index + 1) * (max - index - 1) + getTimeZoneOffset(new Date()) * Minute)
    bar.update({ remaining: `${remaining.getHours() ? `${remaining.getHours()} часов ` : ''}${remaining.getMinutes() ? `${remaining.getMinutes()} ${getMinutes(remaining.getMinutes())} ` : ''}${remaining.getSeconds() ? `${remaining.getSeconds()} ${getSeconds(remaining.getSeconds())}` : ''}` })
    if (typeof file === 'string') {
        bar.update({ filename: file })
        workbook = XLSX.readFile(file)
    } else
        workbook = XLSX.read(file)
    let ws = workbook.Sheets['ЗАКАЗ-НАРЯД']

    let length = JSON.parse(ws['!ref'].match(/\:\w\d+/)[0].match(/\d+/)[0]) - JSON.parse(ws['!ref'].match(/\w\d+\:/)[0].match(/\d+/)[0]) + 1
    let height = ws['!ref'].match(/\:\w\d+/)[0].match(/\w/)[0].charCodeAt(0) - ws['!ref'].match(/\w\d+\:/)[0].match(/\w/)[0].charCodeAt(0) - 1

    let rows = [...new Array(length)].map(_ => {
        return [...new Array(height)].map(_ => null)
    })
    Object.keys(ws).filter(id => id.match(/\w\d+/)).forEach(key => {
        rows[JSON.parse(key.match(/\w\d+/)[0].match(/\d+/)[0]) - JSON.parse(ws['!ref'].match(/\w\d+\:/)[0].match(/\d+/)[0])][key.match(/\w\d+/)[0].match(/\w/)[0].charCodeAt(0) - ws['!ref'].match(/\w\d+\:/)[0].match(/\w/)[0].charCodeAt(0)] = ws[key].v
    })
    rows = rows.filter(row => row[0]).filter(row => typeof row[2] === 'number' && row[2] && row[2] != 23 || row[2] === 'Ширина')

    rows = rows.map(row => {
        if (row[rows[0].findIndex(row => row === 'Примечание')] === 0)
            row[rows[0].findIndex(row => row === 'Примечание')] = ''
        return row
    })

    let publishers = rows.slice(1, rows.length).map(row => {
        return {
            square: row[rows[0].findIndex(row => row === 'Площадь')],
            milling: Boolean(row[rows[0].findIndex(row => row === 'Примечание')]?.toLowerCase().match(Type[2]) || row[rows[0].findIndex(row => row === 'Примечание')]?.toLowerCase().match(Type[1]))
        }
    })
    if (publishers.includes(undefined))
        return

    return publishers
}

module.exports = newOrder
