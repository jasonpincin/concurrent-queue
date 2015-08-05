var test         = require('tape'),
    cq           = require('..')

test('enqueued event', function (t) {
    t.plan(1)

    var q = cq()
    q.enqueued(function (enqueued) {
        t.equal(enqueued.item, 'task 1', 'should provide items added to queue')
    })
    q('task 1')
})

test('processingStarted event', function (t) {
    t.plan(1)

    var q = cq().process(function (item, cb) { })
    q.processingStarted(function (started) {
        t.equal(started.item, 'task 1', 'should provide items as processing starts')
    })
    q('task 1')
})

test('processingEnded event', function (t) {
    t.plan(1)

    var q = cq().process(function (item, cb) { cb() })
    q.processingEnded(function (completed) {
        t.equal(completed.item, 'task 1', 'should provide items ad processing completes')
    })
    q('task 1')
})

test('processingEnded event (with error)', function (t) {
    t.plan(2)

    var q = cq().process(function (item, cb) {
        cb(new Error('failed'))
    })
    q.processingEnded(function (completed) {
        t.equal(completed.err.message, 'failed', 'should provide error when processing fails')
        t.equal(completed.item, 'task 1', 'should provide items when processing fails')
    })
    q('task 1')
})

test('drained event', function (t) {
    t.plan(2)

    var q = cq().limit({ concurrency: 3 }).process(function (item, cb) {
        setTimeout(function () {
            if (item > 5) return cb(new Error('too big'))
            else cb(null, item)
        }, 10)
    })

    var cycleOneDone = false
    q.drained(function () {
        t.ok(true, 'only fires once per cycle')
        if (!cycleOneDone) seedQueue()
        cycleOneDone = true
    })
    seedQueue()

    function seedQueue () {
        var numbers = [1, 9, 3, 0, 8, 4, 7, 2, 5, 6]
        numbers.forEach(q)
    }
})
