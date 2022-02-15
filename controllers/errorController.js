const AppError = require('../utils/appError')

// we transform the wierd error from mongoose into an operational error
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name

  const message = `Duplicate field value '${value}'. Please use another value`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message, 400)
}

const handleJWTError = () =>
  new AppError('Invalid Token! Please login again', 401)

const handleJWTExpiredError = () =>
  new AppError('Your Token has Expired! Please login again.', 401)

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  })
}

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to the client.
  if (err.isOperational)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  // Programming or unknown error: dont want to leak details to client
  else {
    // 1) Log Error(log on the hosting platform that used)
    console.error('ERROR 🤢🤢🤢', err)
    // 2) Send generic message.
    res
      .status(500)
      .json({ status: 'error', message: 'Something went wrong!!', error: err })
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else {
    // In Production

    // The wierd(1st type of error(chapter 118 note)) error coming from the mongoose will have prpty name: 'CastError'
    if (err.name === 'CastError') err = handleCastErrorDB(err)
    if (err.code === 11000) err = handleDuplicateFieldsDB(err) //(chapter 119 note, also look Q&A section of it.)
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err) //(chapter 120)
    if (err.name === 'JsonWebTokenError') err = handleJWTError() //(chapter 131)
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError() //(chapter 131)

    sendErrorProd(err, res)
  }

  next()
}
