var test         = require('tape'),
    cq           = require('..'),
    Promise      = require('promise-polyfill'),
    setImmediate = require('timers').setImmediate

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
    t.throws(function () {
        q.process(processor)
    }, 'only one processor function may be defined')

    q('task 1')
    q('task 2')
    q('task 3')

    setImmediate(function () {

        t.equal(q.pending.length + q.processing.length, 0, 'tasks completed as queued with processor already defined')
    })
})

test('process (promise)', function (t) {
    t.plan(1)
    var q = cq().limit({ concurrency: 2 }).process(function (task) {
        return new Promise(function (resolve, reject) {
            resolve()
        })
    })

    Promise.all([
        q('task 1'),
        q('task 2'),
        q('task 3')
    ]).then(function () {
        t.equal(q.pending.length + q.processing.length, 0, 'all tasks complete with promisy processor')
    })
})
