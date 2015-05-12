var test         = require('tape'),
    cq           = require('..'),
    Promise      = require('promise-polyfill'),
    setImmediate = require('set-immediate-shim')

test('processor', function (t) {
    t.plan(1)
    var q = cq()
    function processor (task, cb) {
        cb()
    }

    t.equal(q.process(processor).processor, processor, 'processor property refers to function passed to process')
})

test('process (cb)', function (t) {
    t.plan(4)
    var q = cq()
    function processor (task, cb) {
        cb()
    }

    t.throws(q.process, 'process requires a processor function')
    t.equal(q.process(processor), q, 'process returns reference to queue')
    t.throws(q.process.bind(null, processor), 'only one processor function may be defined')

    q('task 1')
    q('task 2')
    q('task 3')

    setImmediate(function () {

        t.equal(q.items.length, 0, 'tasks completed as queued with processor already defined')
    })
})

test('process (promise)', function (t) {
    t.plan(1)
    var q = cq().process({ concurrency: 2 }, function (task) {
        return new Promise(function (resolve, reject) {
            resolve()
        })
    })

    Promise.all([
        q('task 1'),
        q('task 2'),
        q('task 3')
    ]).then(function () {
        t.equal(q.items.length, 0, 'all tasks complete with promisy processor')
    })
})

test('process (sync)', function (t) {
    t.plan(5)
    var callCount = 0
    var q = cq().process(function (task) {
        callCount++
        if (callCount === 3) throw new Error('task 3 failed')
        else return task
    })

    q('task 1', function (err, data) {
        t.false(err, 'task 1 should complete without error')
        t.equal(data, 'task 1', 'task 1 should complete with expected data')
    })
    q('task 2', function (err, data) {
        t.false(err, 'task 2 should complete without error')
        t.equal(data, 'task 2', 'task 1 should complete with expected data')
    })
    q('task 3', function (err) {
        t.true(err, 'task 3 should generate an error')
    })
})
