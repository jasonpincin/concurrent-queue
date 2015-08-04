var test         = require('tape'),
    cq           = require('..')

test('isDrained', function (t) {
    t.plan(4)

    var q = cq()
    t.equal(q.isDrained, true, 'should default to true')

    var tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    tasks.forEach(function (task) {
        q(task)
    })
    t.equal(q.isDrained, false, 'should be false after queueing 10 items, before processor set')

    q.limit({ concurrency: 5}).process(function (item, cb) {
        setTimeout(function () {
            cb(null, item)
        }, 100)
    })
    t.equal(q.isDrained, false, 'should be false after setting processor but before processing is complete')

    q.drained(function () {
        t.equal(q.isDrained, true, 'should be true once drained event occurs')
    })
})
