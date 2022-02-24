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

// Chapter 193
const sendErrorDev = (err, req, res) => {
  // originalUrl is the entire URL without the host.
  // if url starts with /api then we are directly tring to access the API(like from postman)
  // else we want to render an error page(cause req is coming from frontend)
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    })
  }

  // RENDERED WEBSITE
  console.error('ERROR 💥', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  })
}

// Chapter 193
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err)
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    })
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    })
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err)
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  })
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res)
  } else {
    // In Production

    // The wierd(1st type of error(chapter 118 note)) error coming from the mongoose will have prpty name: 'CastError'
    if (err.name === 'CastError') err = handleCastErrorDB(err)
    if (err.code === 11000) err = handleDuplicateFieldsDB(err) //(chapter 119 note, also look Q&A section of it.)
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err) //(chapter 120)
    if (err.name === 'JsonWebTokenError') err = handleJWTError() //(chapter 131)
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError() //(chapter 131)

    sendErrorProd(err, req, res)
  }

  next()
}
