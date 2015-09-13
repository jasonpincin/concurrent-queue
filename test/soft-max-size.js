var test   = require('tape'),
    cq     = require('..')

test('soft max size', function (t) {
    var q = cq()
    t.plan(11)

    t.equal(q.softMaxSize, Infinity, 'returns default softMaxSize initially')
    q.softMaxSize = 5
    t.equal(q.softMaxSize, 5, 'allows softMaxSize to be set')
    t.throws(function () {
        q.softMaxSize = {}
    }, 'must be a number')

    q.limit({ softMaxSize: 1 }).process(function (item, cb) {
        setTimeout(function () {
            cb(null, item)
        }, 10)
    })
    q.softLimitReached(function (reached) {
        t.equal(reached.size, q.size, 'should get a soft limit reached message with size = ' + q.size)
    })

    q(1, function (err, result) {
        t.false(err, 'does not supply error under softMaxSize threshold')
        t.equal(result, 1, 'queue processes items under softMaxSize threshold correctly')
    })
    q(2, function (err, result) {
        t.false(err, 'does not supply error at softMaxSize threshold')
        t.equal(result, 2, 'queue processes items at softMaxSize threshold correctly')
    })
    q(3, function (err, result) {
        t.false(err, 'does not supply error over softMaxSize threshold')
        t.equal(result, 3, 'queue processes items over softMaxSize threshold correctly')
    })
})
