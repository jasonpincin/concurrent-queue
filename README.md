# concurrent-queue

[![NPM version](https://badge.fury.io/js/concurrent-queue.png)](http://badge.fury.io/js/concurrent-queue)
[![Build Status](https://travis-ci.org/jasonpincin/concurrent-queue.svg?branch=master)](https://travis-ci.org/jasonpincin/concurrent-queue)
[![Coverage Status](https://coveralls.io/repos/jasonpincin/concurrent-queue/badge.png?branch=master)](https://coveralls.io/r/jasonpincin/concurrent-queue?branch=master)
[![Sauce Test Status](https://saucelabs.com/browser-matrix/jp-concurrent-queue.svg)](https://saucelabs.com/u/jp-concurrent-queue)

Fifo queue with concurrency control

## example

```javascript
var cq = require('concurrent-queue')

var queue = cq().limit({ concurrency: 2 }).process(function (task, cb) {
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

var queue = cq().limit({ concurrency: 2 }).process(function (task) {
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

### var queue = cq()

Create a queue. 

### queue(item [, cb])

Push an item to the queue. Once the item has been processed, the optional callback will be executed with arguments determined by the processor. 

Returns a promise that will be resolved or rejected once the item is processed.

### queue.process(processor)

Configure the queue's `processor` function, to be invoked as concurrency allows with a queued item to be acted upon.

The `processor` argument should be a function with signature `function (item [, cb])`.  If the processor function signature included a callback, an error-first style callback will be passed which should be executed upon completion. If no callback is provided in the function signature, and the processor function returns a `Promise`, the item will be considered complete once the promise is resolved/rejected. 

This function returns a reference to `queue`.

### queue.limit(limitObj)

Set queue limits with a limits object. Valid limit properties are:

* `concurrency` - (default: `Infinity`) - determine how many items in the queue will be processed concurrently
* `maxSize` - (default: `Infinity`) - determine how many items may be pending in the queue before additional items are no longer accepted. When an item is added that would exceed this, the `callback` associated with the item will be invoked with an error and/or the `promise` returned by `queue()` will be rejected. 
* `softMaxSize` - (default: `Infinity`) - determine how many items may be pending before the queue begins producing warnings on the `softLimitReached` eventuate property.

This function returns a reference to `queue`.

### queue.enqueued(func)

`enqueued` is an [eventuate](https://github.com/jasonpincin/eventuate). Use this to supply a function that will be executed when an item is added to the queue.  The function will be passed an object with the following properties:

* `item` - The queued item that is being processed

### queue.rejected(func)

`rejected` is an eventuate. Register a function to be executed when an item is rejected from the queue. This can happen, for example, when maxSize is exceeded. The function will be passed an object with the following properties:

* `item` - The item that was rejected from the queue
* `err` - An error containing the reason for rejection

### queue.softLimitReached(func)

`softLimitReached` is an eventuate. Register a function to be executed when the configured soft size limit has been reached or exceeded. This function will be executed any time an item is added to the `queue` when the `queue.limit` meets or exceeds the `softMaxSize` value. The function will be passed an object with the following properties:

* `size` - the `queue.size`

### queue.processingStarted(func)

`processingStarted` is an eventuate. Register a function to be executed once an item has transitioned from `pending` to `processing`. The function will be passed an object with the following properties:

* `item` - The queued item that is being processed

### queue.processingEnded(func)

`processingEnded` is an eventuate. Register a function to be executed once processing of an item has completed or failed. The function will be passed an object with the following properties:

* `item` - The queued item that was processed
* `err` - Will be present if there was an error while processing the item

### queue.drained(func)

`drained` is an eventuate. Register a function to be executed each time the queue is fully drained (no items pending or processing).

### queue.size

A numeric value representing the number of items in queue, waiting to be processed.

### queue.isDrained

A boolean value indicating whether the queue is in a drained state (no items pending or processing).

### queue.pending

An array of items waiting to be processed.

### queue.processor

The processor function is one has been configured via `queue.process()`,
otherwise `undefined`. This is a read-only (getter) property. 

### queue.processing

An array of items currently being processed.

### queue.concurrency

An integer property representing the number of concurrent queue items that will be processed. This defaults to `Infinity`, but may be re-assigned. An integer value must be assigned to this property.  This property may also be set by calling the `limit()` function and passing an object with the `concurrency` property. Setting this property to `0` will halt the queue (once all in-process items are complete), while setting it to `Infinity` removes all limits.

### queue.maxSize

An integer property representing the maximum number of items that may be pending in the queue. This defaults to `Infinity`, but may be re-assigned. An integer value must be assigned to this property. This property may also be set by calling the `limit()` function and passing an object with the `maxSize` property. 

### queue.softMaxSize

An integer property representing the maximum number of items that may be pending in the queue before warnings are produced. This defaults to `Infinity`, but may be re-assigned. An integer value must be assigned to this property. This property may also be set by calling the `limit()` function and passing an object with the `softMaxSize` property. 

### errors

```javascript
var errors = require('concurrent-queue/errors')
var MaxSizeExceededError = errors.MaxSizeExceededError
```

#### MaxSizeExceededError

Constructor for errors representing the `queue.maxSize` constraint being exceeded. This is supplied to the callback and/or promise rejection when an item cannot be queued due to `queue.maxSize` constraints.  Example:

```javascript
var cq                   = require('concurrent-queue'),
    MaxSizeExceededError = require('concurrent-queue/errors').MaxSizeExceededError

queue = cq().limit({ maxSize: 100, concurrency: 1 }).process(function (item, cb) {
    // do something
})

queue({}, function (err, result) {
    if (err instanceof MaxSizeExceededError) {
        // the queue is full
    }
    else if (err) {
        // otherwise an error happened while processing...
    }
})
```

## install

With [npm](https://npmjs.org) do:

```
npm install concurrent-queue
```

## testing

`npm test [--dot | --spec] [--phantom] [--grep=pattern]`

Specifying `--dot` or `--spec` will change the output from the default TAP style. 
Specifying `--phantom` will cause the tests to run in the headless phantom browser instead of node.
Specifying `--grep` will only run the test files that match the given pattern.

### browser test

`npm run browser-test`

This will run the tests in all browsers (specified in .zuul.yml). Be sure to [educate zuul](https://github.com/defunctzombie/zuul/wiki/cloud-testing#2-educate-zuul) first.

### coverage

`npm run coverage [--html]`

This will output a textual coverage report. Including `--html` will also open 
an HTML coverage report in the default browser.
