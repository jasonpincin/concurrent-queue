var test = require('tape'),
    cq   = require('..')

test('limit', function (t) {
    var q = cq()
    t.plan(3)

    t.throws(limit('maxSize'), 'maxSize requires a number')
    t.throws(limit('softMaxSize'), 'maxSize requires a number')
    t.throws(limit('concurrency'), 'maxSize requires a number')

    function limit (l) {
        var limits = {}
        limits[l] = {}
        return function () {
            q.limit(limits)
        }
    }
})
