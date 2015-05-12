var test = require('tape'),
    cq   = require('..')

test('concurrency', function (t) {
    var q = cq()
    t.plan(3)

    t.equal(q.concurrency, Infinity, 'returns default concurrency initially')
    q.concurrency = 5
    t.equal(q.concurrency, 5, 'allows concurrency to be set')
    t.throws(function () {
        q.concurrency = {}
    }, 'must be a number')
})
