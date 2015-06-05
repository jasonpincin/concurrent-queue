var test         = require('tape'),
    cq           = require('..'),
    Promise      = require('promise-polyfill')

test('processor no args', function (t) {
    t.plan(2)

    var q = cq().process(function () {
        arguments[1](null, true)
    })

    q('task 1', function (err, resolution) {
        t.notOk(err, 'calls back with no error')
        t.ok(resolution, 'calls back with proper data')
    })
})

test('processor no args (promise)', function (t) {
    t.plan(1)

    var q = cq().process(function () {
        return new Promise(function (resolve, reject) {
            resolve(true)
        })
    })

    q('task 1').then(function (resolution) {
        t.ok(resolution, 'resolves')
    })
})
