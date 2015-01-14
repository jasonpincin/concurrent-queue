var test = require('tape'),
    cq   = require('..')

test('concurrent-queue', function (t) {
    var q = cq({ concurrency: 2 })
    t.equal(q.options.concurrency, 2, 'accepts a concurrency option')

    q = cq()
    t.equal(q.options.concurrency, Infinity, 'concurrency defaults to Infinity')

    t.end()
})
