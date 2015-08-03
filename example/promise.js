var cq      = require('..'),
    Promise = require('promise-polyfill')

var queue = cq().limit({ concurrency: 2 }).process(function (task) {
    return new Promise(function (resolve, reject) {
        console.log(task + ' started')
        setTimeout(resolve.bind(undefined, task), 1000)
    })
})

for (var i = 1; i <= 10; i++) queue('task ' + i).then(taskDone).catch(taskError)
function taskDone (task) {
    console.log(task + ' done')
}
function taskError (err) {
    console.error(err)
}
