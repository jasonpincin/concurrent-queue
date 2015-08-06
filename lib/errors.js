var inherits = require('util').inherits

function MaxSizeExceededError (message) {
    Error.captureStackTrace(this, MaxSizeExceededError)
    this.name = 'MaxSizeExceededError'
    this.message = message
}
inherits(MaxSizeExceededError, Error)
exports.MaxSizeExceededError = MaxSizeExceededError
