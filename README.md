# concurrent-queue

[![NPM version](https://badge.fury.io/js/concurrent-queue.png)](http://badge.fury.io/js/concurrent-queue)
[![Build Status](https://travis-ci.org/jasonpincin/concurrent-queue.svg?branch=master)](https://travis-ci.org/jasonpincin/concurrent-queue)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/concurrent-queue/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/concurrent-queue?branch=master)
[![Davis Dependency Status](https://david-dm.org/jasonpincin/concurrent-queue.png)](https://david-dm.org/jasonpincin/concurrent-queue)

Fifo queue with concurrency control

## example

```javascript
var cq = require('concurrent-queue')

var queue = cq().process({ concurrency: 2 }, function (task, cb) {
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

```javascript
var cq = require('concurrent-queue')

var queue = cq().process({ concurrency: 2 }, function (task) {
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

```javascript
var cq = require('concurrent-queue')
```

### var queue = cq(options)

Create a queue. 

### queue(item [, cb])

Push an item to the queue. Once the item has been processed, the optional callback will 
be executed with arguments determined by the processor. 

Returns a promise that will be resolved or rejected once the item is processed.

### queue.process([options, ] processor)

Configure the queue's `processor` function, to be invoked as concurrency allows with a queued item 
to be acted upon.

The optional `options` argument should be an object. It may contain a `concurrency` property that 
determines how many items in the queue will be processed concurrently. The default `concurrency` is 
`Infinity`.

The `processor` argument should be a function with signature `function (item [, cb])`.  If 
the processor function signature included a callback, an error-first style callback will be passed 
which should be executed upon completion. If no callback is provided in the function signature, and 
the processor function returns a `Promise`, the item will be considered complete once the promise 
is resolved/rejected. 

This function returns a reference to `queue`.

### queue.items

An array of all queued items (both pending and processing).

### queue.processing

An array of items currently being processed.

### queue.pending

An array of items waiting to be processed.

### queue.concurrency

An integer property representing the number of concurrent queue items that will be processed. This 
defaults to `Infinity`, but may be re-assigned. An integer value must be assigned to this property. 
This property may also be set by passing an options object to the `process` function (above) and 
specifying `concurrency` in that options object. To change concurrency after `process` is called, 
the new value must be assigned to this property. Setting this property to `0` will halt the queue 
(once all in-process items are complete), while setting it to `Infinity` removes all limits.


## testing

`npm test [--dot | --spec] [--coverage | --grep=pattern]`

Specifying `--dot` or `--spec` will change the output from the default TAP style. 
Specifying `--coverage` will print a text coverage summary to the terminal after 
tests have ran, while `--pattern` will only run the test files that match the given 
pattern.

Open an html coverage report with `npm run view-cover`.
