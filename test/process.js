var test = require('tape'),
    cq   = require('..')

test('process', function (t) {
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
        t.end()
    })
})
