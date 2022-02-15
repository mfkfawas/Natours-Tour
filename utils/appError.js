class AppError extends Error {
  constructor(message, statusCode) {
    //we only pass message coz 'message' is the only parameter built-in Error accepts.
    super(message)

    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    //when a new object is created and when constructor function is called then that fn call will not
    //appear in the stack trace, and will not pollute it.
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError
