# concurrent-queue

[![NPM version](https://badge.fury.io/js/concurrent-queue.png)](http://badge.fury.io/js/concurrent-queue)
[![Build Status](https://travis-ci.org/jasonpincin/concurrent-queue.svg?branch=master)](https://travis-ci.org/jasonpincin/concurrent-queue)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/concurrent-queue/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/concurrent-queue?branch=master)
[![Davis Dependency Status](https://david-dm.org/jasonpincin/concurrent-queue.png)](https://david-dm.org/jasonpincin/concurrent-queue)

Fifo queue with concurrency control

## example

```
var cq = require('concurrent-queue')

var queue = cq({ concurrency: 2 }).process(function (task, cb) {
    console.log(task + ' started')
    setTimeout(function () {
        cb(null, task)
    }, 1000)
})

for (var i = 1; i <= 10; i++) queue('task '+i, function (err, task) {
    console.log(task + ' done')
})
```

or with promises:

```
var cq      = require('concurrent-queue')

var queue = cq({ concurrency: 2 }).process(function (task) {
    return new Promise(function (resolve, reject) {
        console.log(task + ' started')
        setTimeout(resolve.bind(undefined, task), 1000)
    })
})

for (var i = 1; i <= 10; i++) queue('task '+i).then(function (task) {
    console.log(task + ' done')
})
```

## api

```
var cq = require('concurrent-queue')
```

### var queue = cq(options)

Create a queue. The options object may contain a `concurrency` property that determines 
how many items in the queue will be processed concurrently. The default `concurrency` is 
`Infinity`.

### queue(item [, cb])

Push an item to the queue. Once the item has been processed, the optional callback will 
be executed with arguments determined by the processor. 

Returns a promise that will be resolved or rejected once the item is processed.

### queue.process(processor)

Configure the processor function with signature `function (item [, cb])`. This function is 
invoked as concurrency allows, providing a queued `item` to be acted upon. If the processor 
function signature included a callback, an error-first style callback will be passed which 
should be executed upon completion. If no callback is provided in the function signature, and 
the processor function returns a `Promise`, the item will be considered complete once the promise 
is resolved/rejected. If neither a callback is accepted, nor a promise returned, the function 
will be treated as a synchronous function, and it's return value (or thrown exception) will be 
passed to the original `queue` callback or promise (resolved if data returned, rejected if 
error thrown).

This function returns a reference to `queue`.

### queue.items

An array of all queued items (both pending and processing).

### queue.processing

An array of items currently being processed.

### queue.pending

An array of items waiting to be processed.


## testing

`npm test [--dot | --spec] [--coverage]`

Alternatively, only run test files matching a certain pattern by prefixing the command 
with `grep=pattern`. Example: `grep=init npm test`

Open an html coverage report after running tests with `npm run view-cover` or `npm run vc`
