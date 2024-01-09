function validate(value) {
    if (!value || value.length != value.match(/\d+/)?.[0].length)
        return false
    return true
}

function order() {
    if (!validate(document.getElementById('order').value))
        return alert('Укажите номер заказа в виде целого числа')

    let orders = window.localStorage.getItem('orders')
    if (!orders)
        orders = []
    else
        orders = JSON.parse(orders)
    if (orders.includes(JSON.parse(document.getElementById('order').value)))
        return document.getElementById('order').value = null
    orders.push(JSON.parse(document.getElementById('order').value))
    window.localStorage.setItem('orders', JSON.stringify(orders))
    document.getElementById('order').value = null
    document.getElementById('orders').innerText = orders.join(', ')
}

function polyester() {
    if (!validate(document.getElementById('polyester').value))
        return alert('Укажите затраты полиэфира в виде целого количества грамм')

    window.localStorage.setItem('polyester', JSON.parse(document.getElementById('polyester').value))
}

function polyurethane() {
    if (!validate(document.getElementById('polyurethane').value))
        return alert('Укажите затраты полиуретана в виде целого количества грамм')

    window.localStorage.setItem('polyurethane', JSON.parse(document.getElementById('polyurethane').value))
}

function insulator() {
    if (!validate(document.getElementById('insulator').value))
        return alert('Укажите затраты изолятора в виде целого количества грамм')

    window.localStorage.setItem('insulator', JSON.parse(document.getElementById('insulator').value))
}

function setExpenses() {
    console.log({
        orders: JSON.parse(window.localStorage.getItem('orders')),
        polyester: JSON.parse(window.localStorage.getItem('polyester')),
        polyurethane: JSON.parse(window.localStorage.getItem('polyurethane')),
        insulator: JSON.parse(window.localStorage.getItem('insulator'))
    })
    fetch('setExpenses', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            orders: JSON.parse(window.localStorage.getItem('orders')),
            polyester: JSON.parse(window.localStorage.getItem('polyester')),
            polyurethane: JSON.parse(window.localStorage.getItem('polyurethane')),
            insulator: JSON.parse(window.localStorage.getItem('insulator'))
        })
    })
        .then(response => response.ok ? response : Promise.reject(response))
        .then(response => response.json())
        .then(message => {
            for (let line of message) {
                let element = document.createElement('label')
                element.classList.add('message')
                element.innerText = line

                document.getElementById('message').appendChild(element)
            }
        })
        .catch(error => error.statusText ? alert(error.statusText) : alert(error))
}
