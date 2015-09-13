var assert               = require('assert'),
    assign               = require('object-assign'),
    onerr                = require('on-error'),
    eventuate            = require('eventuate'),
    once                 = require('once'),
    Promise              = require('promise-polyfill'),
    after                = require('afterward'),
    setImmediate         = require('timers').setImmediate,
    MaxSizeExceededError = require('./errors').MaxSizeExceededError

module.exports = function () {
    var pending     = [],
        processing  = [],
        maxSize     = Infinity,
        softMaxSize = Infinity,
        concurrency = Infinity,
        drained     = true,
        processor

    function cq (item, cb) {
        var done = new Promise(function (resolve, reject) {
            if (pending.length >= maxSize) {
                var err = new MaxSizeExceededError('unable to queue item')
                reject(err)
                return cq.rejected.produce({ item: item, err: err })
            }
            if (pending.length >= softMaxSize) cq.softLimitReached.produce({ size: pending.length })

            drained = false
            setImmediate(drain)
            pending.push({
                item   : item,
                resolve: onResolve,
                reject : onReject
            })
            cq.enqueued.produce({ item: item })

            function onResolve (value) {
                resolve(value)
                cq.processingEnded.produce({ item: item, result: value })
            }

            function onReject (err) {
                reject(err)
                cq.processingEnded.produce({ item: item, err: err })
            }
        })

        return after(done, cb)
    }
    Object.defineProperties(cq, {
        size             : { get: getSize, enumerable: true },
        isDrained        : { get: getIsDrained, enumerable: true },
        pending          : { get: getPending, enumerable: true },
        processing       : { get: getProcessing, enumerable: true },
        concurrency      : { get: getConcurrency, set: setConcurrency, enumerable: true },
        maxSize          : { get: getMaxSize, set: setMaxSize, enumerable: true },
        softMaxSize      : { get: getSoftMaxSize, set: setSoftMaxSize, enumerable: true },
        processor        : { get: getProcessor },
        limit            : { value: limit },
        process          : { value: process },
        enqueued         : { value: eventuate() },
        rejected         : { value: eventuate() },
        softLimitReached : { value: eventuate() },
        processingStarted: { value: eventuate() },
        processingEnded  : { value: eventuate() },
        drained          : { value: eventuate() }
    })

    return cq

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

    function process (func) {
        if (typeof func !== 'function') throw new TypeError('process requires a processor function')
        assert(!processor, 'queue processor already defined')
        processor = func
        setImmediate(drain)
        return cq
    }

    function limit (limits) {
        limits = assign({ concurrency: Infinity, maxSize: Infinity, softMaxSize: Infinity }, limits)
        if (typeof limits.maxSize !== 'number') throw new TypeError('maxSize must be a number')
        if (typeof limits.softMaxSize !== 'number') throw new TypeError('softMaxSize must be a number')
        if (typeof limits.concurrency !== 'number') throw new TypeError('concurrency must be a number')
        maxSize = limits.maxSize
        softMaxSize = limits.softMaxSize
        concurrency = limits.concurrency
        return cq
    }

    function getSize () {
        return pending.length
    }

    function getIsDrained () {
        return drained
    }

    function getPending () {
        return pending.map(function (task) {
            return task.item
        })
    }

    function getProcessing () {
        return processing.map(function (task) {
            return task.item
        })
    }

    function getConcurrency () {
        return concurrency
    }

    function setConcurrency (value) {
        if (typeof value !== 'number') throw new TypeError('concurrency must be a number')
        concurrency = value
    }

    function getMaxSize () {
        return maxSize
    }

    function setMaxSize (value) {
        if (typeof value !== 'number') throw new TypeError('maxSize must be a number')
        maxSize = value
    }

    function getSoftMaxSize () {
        return softMaxSize
    }

    function setSoftMaxSize (value) {
        if (typeof value !== 'number') throw new TypeError('softMaxSize must be a number')
        softMaxSize = value
    }

    function getProcessor () {
        return processor
    }
}
