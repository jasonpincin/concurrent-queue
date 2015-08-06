var assert       = require('assert'),
    assign       = require('object-assign'),
    onerr        = require('on-error'),
    eventuate    = require('eventuate'),
    once         = require('once'),
    Promise      = require('promise-polyfill'),
    setImmediate = require('set-immediate-shim'),
    errors       = require('./lib/errors')

module.exports = function () {
    var pending     = [],
        processing  = [],
        maxSize     = Infinity,
        concurrency = Infinity,
        drained     = true,
        processor

    function cq (item, cb) {
        cb = typeof cb === 'function' ? cb : function () {}
        if (pending.length >= maxSize) {
            var err = new errors.MaxSizeExceededError('unable to queue item')
            cb(err)
            cq.rejected.produce({ item: item, err: err })
            return Promise.reject(err)
        }
        drained = false
        setImmediate(drain)
        return new Promise(function (resolve, reject) {
            pending.push({
                item: item,
                resolve: function (value) {
                    cb.apply(undefined, [null].concat(Array.prototype.slice.call(arguments, 0)))
                    resolve.apply(undefined, arguments)
                    cq.processingEnded.produce({ item: item })
                },
                reject: function (err) {
                    cb(err)
                    reject(err)
                    cq.processingEnded.produce({ err: err, item: item })
                }
            })
            cq.enqueued.produce({ item: item })
        })
    }
    Object.defineProperties(cq, {
        size: { enumerable: true, get: function () {
            return pending.length
        }},
        isDrained: { enumerable: true, get: function () {
            return drained
        }},
        pending: { enumerable: true, get: function () {
            return pending.map(function (task) {
                return task.item
            })
        }},
        processing: { enumerable: true, get: function () {
            return processing.map(function (task) {
                return task.item
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
        }},
        limit: { value: function (limits) {
            limits = assign({ concurrency: Infinity, maxSize: Infinity }, limits)
            assert(typeof limits.maxSize === 'number', 'maxSize must be a number')
            assert(typeof limits.concurrency === 'number', 'concurrency must be a number')
            maxSize = limits.maxSize
            concurrency = limits.concurrency
            return cq
        }},
        process: { value: function (func) {
            assert(typeof func === 'function', 'process requires a processor function')
            assert(!processor, 'queue processor already defined')
            processor = func
            setImmediate(drain)
            return cq
        }},
        enqueued: { value: eventuate() },
        rejected: { value: eventuate() },
        processingStarted: { value: eventuate() },
        processingEnded: { value: eventuate() },
        drained: { value: eventuate() }
    })

    function drain () {
        if (!drained && pending.length === 0 && processing.length === 0) {
            drained = true
            cq.drained.produce()
        }
        while (processor && pending.length > 0 && processing.length < concurrency) drainItem()
        function drainItem () {
            var task = pending.shift()
            processing.push(task)
            cq.processingStarted.produce({ item: task.item })

            var reject = once(function reject (err) {
                processing.splice(processing.indexOf(task), 1)
                task.reject(err)
                setImmediate(drain)
            })
            var resolve = once(function resolve () {
                processing.splice(processing.indexOf(task), 1)
                task.resolve.apply(undefined, arguments)
                setImmediate(drain)
            })

            var p
            try {
                p = processor(task.item, onerr(reject).otherwise(resolve))
            }
            catch (err) {
                return reject(err)
            }
            if (p && typeof p.then === 'function') p.then(resolve, reject)
        }
    }

    return cq
}

assign(module.exports, errors)
