var test         = require('tape'),
    cq           = require('..')

test('enqueued event', function (t) {
    t.plan(1)

    var q = cq()
    q.enqueued(function (item) {
        t.equal(item, 'task 1', 'should provide items added to queue')
    })
    q('task 1')
})

test('started event', function (t) {
    t.plan(1)

    var q = cq().process(function (item, cb) { })
    q.started(function (item) {
        t.equal(item, 'task 1', 'should provide items as processing starts')
    })
    q('task 1')
})

test('completed event', function (t) {
    t.plan(1)

    var q = cq().process(function (item, cb) { cb() })
    q.completed(function (item) {
        t.equal(item, 'task 1', 'should provide items ad processing completes')
    })
    q('task 1')
})

test('failed event', function (t) {
    t.plan(2)

    var q = cq().process(function (item, cb) {
        cb(new Error('failed'))
    })
    q.failed(function (result) {
        t.equal(result.err.message, 'failed', 'should provide error when processing fails')
        t.equal(result.item, 'task 1', 'should provide items when processing fails')
    })
    q('task 1')
})
