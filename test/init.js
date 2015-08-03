var test = require('tape'),
    cq   = require('..')

test('concurrent-queue', function (t) {
    var q = cq()
    t.equal(typeof q, 'function', 'returns a function')
    t.ok(q.process, 'has a process function')
    t.ok(q.processing, 'has a processing property')
    t.ok(q.size === 0, 'has a size property')
    t.ok(q.pending, 'has a pending property')
    t.ok(q.maxSize, 'has a maxSize property')
    t.ok(q.concurrency, 'has a concurrency property')

    t.end()
})
