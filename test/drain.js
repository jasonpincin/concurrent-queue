var test         = require('tape'),
    cq           = require('..'),
    setImmediate = require('timers').setImmediate

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

    t.equal(q.size, 3, 'items exist before processor')
    t.equal(q.pending.length, 3, 'items exist before processor')
    t.equal(q.processing.length, 0, 'nothing in processing state before processor')

    q.limit({ concurrency: Infinity }).process(processorImmediate)
    setImmediate(function () {
        t.equal(q.pending.length + q.processing.length, 0, 'all items processed immediately')
        t.end()
    })
})

test('drain with concurrency of 2 and immediate processor', function (t) {
    var q = cq()

    q('task 1')
    q('task 2')
    q('task 3')

    q.limit({ concurrency: 2 }).process(processorImmediate)
    setImmediate(function () {
        t.equal(q.pending.length + q.processing.length, 0, 'all items processed immediately')
        t.end()
    })
})

test('drain with concurrency of 2 and fast processor', function (t) {
    var q = cq()

    q('task 1')
    q('task 2')
    q('task 3')

    q.limit({ concurrency: 2 }).process(processorFast)
    setImmediate(function () {
        t.equal(q.size, 1, 'size = 1 after processor')
        t.equal(q.pending.length, 1, '1 item pending after processor')
        t.equal(q.processing.length, 2, '2 items processing after processor')

        setImmediate(function () {

            t.equal(q.size, 1, 'size = 1 after 2 ticks')
            t.equal(q.pending.length, 1, '1 item pending after 2 ticks')
            t.equal(q.processing.length, 0, '0 items processing 2 ticks')

            setImmediate(function () {

                t.equal(q.size, 0, 'size = 0 after 3 ticks')
                t.equal(q.pending.length, 0, '0 items pending after 3 ticks')
                t.equal(q.processing.length, 1, '1 item processing 3 ticks')

                setImmediate(function () {

                    t.equal(q.size, 0, 'size = 0 after 4 ticks')
                    t.equal(q.pending.length, 0, '0 items pending after 4 ticks')
                    t.equal(q.processing.length, 0, '0 items processing 4 ticks')
                    t.end()
                })
            })
        })
    })

})
