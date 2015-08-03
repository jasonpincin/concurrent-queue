var cq = require('..')

var queue = cq().limit({ concurrency: 2 }).process(function (task, cb) {
    console.log(task + ' started')
    setTimeout(function () {
        cb(null, task)
    }, 1000)
})

for (var i = 1; i <= 10; i++) queue('task ' + i, taskDone)
function taskDone (err, task) {
    if (err) return console.error(err)
    console.log(task + ' done')
}
