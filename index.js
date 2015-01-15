var assign  = require('object-assign'),
    assert  = require('assert'),
    onerr   = require('on-error'),
    Promise = require('promise-polyfill')

module.exports = function (options) {
    var pending    = [],
        processing = []

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
    cq.process = function (processor) {
        assert(typeof processor === 'function', 'process requires a processor function')
        assert(!cq.processor, 'queue processor already defined')
        cq.processor = processor
        setImmediate(drain)
        return cq
    }
    cq.options = assign({ concurrency: Infinity }, options)

    Object.defineProperties(cq, {
        items: { get: function () {
            return cq.processing.concat(cq.pending)
        }},
        pending: { get: function () {
            return pending.map(function (item) {
                return item.task
            })
        }},
        processing: { get: function () {
            return processing.map(function (item) {
                return item.task
            })
        }}
    })

    function drain() {
        while (cq.processor && pending.length > 0 && processing.length < cq.options.concurrency) (function () {
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
            if (cq.processor.length !== 1) cq.processor(item.task, onerr(reject, resolve))
            else {
                try {
                    var p = cq.processor(item.task)
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
