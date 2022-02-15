//Everything related to the app's(express) configuration in one file.
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')

const app = express()

// 1) GLOBAL MIDDLEWARES
//Set security HTTP headers
app.use(helmet())

//Development logging
if (process.env.NODE_ENV === 'production') app.use(morgan('dev'))

//Limit the requests from the same IP.
const limiter = rateLimit({
  max: 100, //100 req
  windowMs: 60 * 60 * 1000, //1 hr
  message: 'Too many requests from this IP, please try again in one hour!!!',
})
app.use('/api', limiter)

//Body Parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }))

//Data sanitization against noSQL query injections.
app.use(mongoSanitize())

//Data sanitization against XSS.
app.use(xss())

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
)

//Serving Static files
app.use(express.static(`${__dirname}/public`))

// Creating our own middleware
// app.use((req, res, next) => {
//   console.log('Hello from middleware✌️✌️✌️')
//   next()
// })
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString()
  next()
})

// 3) ROUTES
//mounting the router.
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

//If we have a req that makes to this point of our code, then it means that neither the tourRouter
// nor the userRouter were able to catch it.
//we want to handle all hte routes, all the URLs for all the verbs(get, post,..) in this one handler.(Chapter 111)
app.all('*', (req, res, next) => {
  // res.status(404).json({
  // status: 'Fail',
  //req.originalUrl - a property we have on requst, which have the Url that is requested.
  //   message: `Can't find ${req.originalUrl} on this server.`,
  // })
  // })

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

app.use(globalErrorHandler)

// 4) START SERVER
module.exports = app
