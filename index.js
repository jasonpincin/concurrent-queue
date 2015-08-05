var assert       = require('assert'),
    assign       = require('object-assign'),
    onerr        = require('on-error'),
    eventuate    = require('eventuate'),
    once         = require('once'),
    Promise      = require('promise-polyfill'),
    setImmediate = require('set-immediate-shim')

module.exports = function () {
    var pending     = [],
        processing  = [],
        maxSize     = Infinity,
        concurrency = Infinity,
        drained     = true,
        processor

    function cq (task, cb) {
        cb = typeof cb === 'function' ? cb : function () {}
        if (pending.length >= maxSize) {
            var err = new Error('max queue size exceeded')
            cb(err)
            cq.rejected.produce({ item: task, err: err })
            return Promise.reject(err)
        }
        drained = false
        setImmediate(drain)
        return new Promise(function (resolve, reject) {
            pending.push({
                task: task,
                resolve: function (value) {
                    cb.apply(undefined, [null].concat(Array.prototype.slice.call(arguments, 0)))
                    resolve.apply(undefined, arguments)
                    cq.processingEnded.produce({ item: task })
                },
                reject: function (err) {
                    cb(err)
                    reject(err)
                    cq.processingEnded.produce({ err: err, item: task })
                }
            })
            cq.enqueued.produce({ item: task })
        })
    }
    cq.limit = function (limits) {
        limits = assign({ concurrency: Infinity, maxSize: Infinity }, limits)
        assert(typeof limits.maxSize === 'number', 'maxSize must be a number')
        assert(typeof limits.concurrency === 'number', 'concurrency must be a number')
        maxSize = limits.maxSize
        concurrency = limits.concurrency
        return cq
    }
    cq.process = function (func) {
        assert(typeof func === 'function', 'process requires a processor function')
        assert(!processor, 'queue processor already defined')
        processor = func
        setImmediate(drain)
        return cq
    }
    cq.enqueued = eventuate()
    cq.rejected = eventuate()
    cq.processingStarted = eventuate()
    cq.processingEnded = eventuate()
    cq.drained = eventuate()

    Object.defineProperties(cq, {
        size: { enumerable: true, get: function () {
            return pending.length
        }},
        isDrained: { enumerable: true, get: function () {
            return drained
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
        maxSize: { enumerable: true, get: function () {
            return maxSize
        }, set: function (value) {
            if (typeof value !== 'number') throw new TypeError('maxSize must be a number')
            maxSize = value
        }},
        processor: { get: function () {
            return processor
        }}
    })

    function drain () {
        if (!drained && pending.length === 0 && processing.length === 0) {
            drained = true
            cq.drained.produce()
        }
        while (processor && pending.length > 0 && processing.length < concurrency) drainItem()
        function drainItem () {
            var item = pending.shift()
            processing.push(item)
            cq.processingStarted.produce({ item: item.task })

            var reject = once(function reject (err) {
                processing.splice(processing.indexOf(item), 1)
                item.reject(err)
                setImmediate(drain)
            })
            var resolve = once(function resolve () {
                processing.splice(processing.indexOf(item), 1)
                item.resolve.apply(undefined, arguments)
                setImmediate(drain)
            })

            var p
            try {
                p = processor(item.task, onerr(reject).otherwise(resolve))
            }
            catch (err) {
                return reject(err)
            }
            if (p && typeof p.then === 'function') p.then(resolve, reject)
        }
    }

    return cq
}
