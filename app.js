//Everything related to the app's(express) configuration in one file.
const path = require('path')
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const compression = require('compression')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes')

const app = express()

//To understand more about this read 'Testing for secure HTTPS connections' in blue classmate notebook backside.
app.enable('trust proxy')

//defining our view engine
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// 1) GLOBAL MIDDLEWARES
//To understand more about this read 'Implementing CORS' in blue classmate notebook backside.
app.use(cors())
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

//To understand more about this read 'Implementing CORS' in blue classmate notebook backside.
app.options('*', cors())
// app.options('/api/v1/tours/:id', cors());

//Serving Static files
app.use(express.static(path.join(__dirname, 'public')))

// stack over flow(not in jonas code)(Access to fetch at 'http://127.0.0.1:3000/api/v1/users/login'
// from origin 'http://localhost:3000' has been blocked by CORS policy: Response
// to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin'
// header is present on the requested resource. If an opaque response serves your needs, set
// the request's mode to 'no-cors' to fetch the resource with CORS disabled.)
// const corsOptions = {
//   credentials: true, //access-control-allow-credentials:true
//   origin: 'http://localhost:3000',
//   optionSuccessStatus: 200,
// }
// app.use(cors(corsOptions)) // Use this after the variable declaration

//Set security HTTP headers
app.use(helmet())

// Apply middleware before routes

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
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser()) // Chapter 189 - parse cookies to req.cookies

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

// Creating our own middleware
// app.use((req, res, next) => {
//   console.log('Hello from middleware✌️✌️✌️')
//   next()
// })

//This only gonna compress text(HTML/JSON) & not images in responses.
app.use(compression())

app.use((req, res, next) => {
  // console.log(req.cookies)
  req.requestTime = new Date().toISOString()
  next()
})

// 3) ROUTES

app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

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
