var test   = require('tape'),
    cq     = require('..'),
    errors = require('../errors')

test('max size', function (t) {
    var q = cq()
    t.plan(9)

    t.equal(q.maxSize, Infinity, 'returns default maxSize initially')
    q.maxSize = 5
    t.equal(q.maxSize, 5, 'allows maxSize to be set')
    t.throws(function () {
        q.maxSize = {}
    }, 'must be a number')

    q.limit({ maxSize: 1 }).process(function (item, cb) {
        setTimeout(function () {
            cb(null, item)
        }, 10)
    })
    q.rejected(function (rejected) {
        t.equal(rejected.item, 2, 'should get a rejected message with the item when max size is exceeded')
        t.true(rejected.err, 'should get a rejected message with an error when max size exceeded')
    })

    q(1, function (err, result) {
        t.false(err, 'does not supply error under maxSize threshold')
        t.equal(result, 1, 'queue processes items under maxSize threshold correctly')
    })
    q(2, function (err, result) {
        t.true(err, 'queue supplies error when maxSize exceeded')
        t.ok(err instanceof errors.MaxSizeExceededError, 'should throw the proper error type')
    })
})
