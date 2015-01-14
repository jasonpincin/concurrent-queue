var test = require('tape'),
    cq   = require('..')

test('push', function (t) {
    var q = cq()

    q('task 1', function (err, data) {
        t.equal(data, 'task 1', 'task 1 cb executed with expected data')
        t.false(err, 'no error on task 1')
    })
    q('task 2', function (err) {
        t.true(err, 'task 2 cb executed with error')
    })
    q('task 3')
    t.equal(q.items.length, 3, 'items.length reflects total queue size')

    q.process(function (task, cb) {
        if (task === 'task 1') cb(null, task)
        if (task === 'task 2') cb(true)
        if (task === 'task 3') t.end()
    })
})
