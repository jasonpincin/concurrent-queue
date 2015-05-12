var cq = require('..')

var queue = cq().process({ concurrency: 2 }, function (task, cb) {
    console.log(task + ' started')
    setTimeout(function () {
        cb(null, task)
    }, 1000)
})

for (var i = 1; i <= 10; i++) queue('task '+i, function (err, task) {
    console.log(task + ' done')
})
