var test         = require('tape'),
    cq           = require('..'),
    setImmediate = require('set-immediate-shim')

function processorImmediate (task, cb) {
    cb()
}

function processorFast (task, cb) {
    setImmediate(cb)
}

test('drain infinite concurrency and immediate processor', function (t) {
    var q = cq()

    q('task 1')
    q('task 2')
    q('task 3')

    t.equal(q.items.length, 3, 'items exist before processor')
    t.equal(q.pending.length, q.items.length, 'items are in pending state before processor')
    t.equal(q.processing.length, 0, 'nothing in processing state before processor')

    q.process({ concurrency: Infinity }, processorImmediate)
    setImmediate(function () {
        t.equal(q.items.length + q.pending.length + q.processing.length, 0, 'all items processed immediately')
        t.end()
    })
})

test('drain with concurrency of 2 and immediate processor', function (t) {
    var q = cq()

    q('task 1')
    q('task 2')
    q('task 3')

    q.process({ concurrency: 2 }, processorImmediate)
    setImmediate(function () {
        t.equal(q.items.length + q.pending.length + q.processing.length, 0, 'all items processed immediately')
        t.end()
    })
})

test('drain with concurrency of 2 and fast processor', function (t) {
    var q = cq()

    q('task 1')
    q('task 2')
    q('task 3')

    q.process({ concurrency: 2 }, processorFast)
    setImmediate(function () {
        t.equal(q.pending.length, 1, '1 item pending after processor')
        t.equal(q.processing.length, 2, '2 items processing after processor')
        t.equal(q.items.length, 3, '3 items total after processor')

        setImmediate(function () {

            t.equal(q.pending.length, 1, '1 item pending after 2 ticks')
            t.equal(q.processing.length, 0, '0 items processing 2 ticks')
            t.equal(q.items.length, 1, '1 item total after 2 ticks')


            setImmediate(function () {

                t.equal(q.pending.length, 0, '1 items pending after 3 ticks')
                t.equal(q.processing.length, 1, '1 item processing 3 ticks')
                t.equal(q.items.length, 1, '1 item total after 3 ticks')

                setImmediate(function () {

                    t.equal(q.pending.length, 0, '0 items pending after 4 ticks')
                    t.equal(q.processing.length, 0, '0 items processing 4 ticks')
                    t.equal(q.items.length, 0, '0 items total after 4 ticks')
                    t.end()
                })
            })
        })
    })

})
