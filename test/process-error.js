var test         = require('tape'),
    cq           = require('..')

test('processor throws error error', function (t) {
    t.plan(2)

    var q = cq().process(function (task, cb) {
        throw new Error('busted')
    })

    q('task 1', function (err, resolution) {
        t.ok(err, 'should receive error to callback')
        t.notOk(resolution, 'calls back with no data')
    })
})

test('processor throws error (promise)', function (t) {
    t.plan(1)

    var q = cq().process(function () {
        throw new Error('busted')
    })

    q('task 1').catch(function (err) {
        t.ok(err, 'receives error')
    })
})
