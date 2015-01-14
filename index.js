var assign = require('object-assign'),
    assert = require('assert')

module.exports = function (options) {
    var pending    = [],
        processing = []

    function cq (task, cb) {
        pending.push({task: task, cb: cb})
        setImmediate(drain)
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
            cq.processor(item.task, function () {
                processing.splice(processing.indexOf(item), 1)
                if (item.cb) item.cb.apply(undefined, arguments)
                setImmediate(drain)
            })
        })()
    }

    return cq
}
