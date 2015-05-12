var assign       = require('object-assign'),
    assert       = require('assert'),
    onerr        = require('on-error'),
    Promise      = require('promise-polyfill'),
    setImmediate = require('set-immediate-shim')

module.exports = function () {
    var pending     = [],
        processing  = [],
        concurrency = Infinity,
        processor

    function cq (task, cb) {
        cb = cb || function () {}
        setImmediate(drain)
        return new Promise(function (resolve, reject) {
            pending.push({
                task: task,
                resolve: function () {
                    cb.apply(undefined, [null].concat(Array.prototype.slice.call(arguments, 0)))
                    resolve.apply(undefined, arguments)
                },
                reject: function (err) {
                    cb(err)
                    reject(err)
                }
            })
        })
    }
    cq.process = function (options, func) {
        if (arguments.length === 1) {
            func = options
            options = {}
        }
        assert(typeof func === 'function', 'process requires a processor function')
        assert(!processor, 'queue processor already defined')
        concurrency = options.concurrency || Infinity
        processor = func
        setImmediate(drain)
        return cq
    }

    Object.defineProperties(cq, {
        items: { enumerable: true, get: function () {
            return cq.processing.concat(cq.pending)
        }},
        pending: { enumerable: true, get: function () {
            return pending.map(function (item) {
                return item.task
            })
        }},
        processing: { enumerable: true, get: function () {
            return processing.map(function (item) {
                return item.task
            })
        }},
        concurrency: { enumerable: true, get: function () {
            return concurrency
        }, set: function (value) {
            if (typeof value !== 'number') throw new TypeError('concurrency must be a number')
                concurrency = value
        }},
        processor: { get: function () {
            return processor
        }}
    })

    function drain() {
        while (processor && pending.length > 0 && processing.length < concurrency) (function () {
            var item = pending.shift()
            processing.push(item)

            function reject (err) {
                processing.splice(processing.indexOf(item), 1)
                item.reject(err)
                setImmediate(drain)
            }
            function resolve () {
                processing.splice(processing.indexOf(item), 1)
                item.resolve.apply(undefined, arguments)
                setImmediate(drain)
            }
            if (processor.length !== 1) processor(item.task, onerr(reject).otherwise(resolve))
            else {
                try {
                    var p = processor(item.task)
                }
                catch (err) {
                    return reject(err)
                }
                if (p && typeof p.then === 'function') p.then(resolve, reject)
                else resolve(p)
            }
        })()
    }

    return cq
}
