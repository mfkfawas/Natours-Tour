//In backend for stripe: we want to download stripe package, require('stripe') gives a fn, so we passed our key to that fn.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId)

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // INFORMATION ABOUT THE SESSION
    payment_method_types: ['card'],
    //url that will be callied as soon as a credit card has been succesfully charged.
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    //url tha will be called if user cancels the payment.
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    //this field allow us to pass in some data about the session that we are currently creating. Tha imp cz later once the purchase was successful,
    //we will then get access to the session obj again. And by then we want to create a new booking in our DB. Even though that work in prod mode,
    //lets prepare for that. So to create a new booking in our DB, we need user's ID tour's ID and the price. Here we already have access to user's
    //email(we can get users ID from that). We will also specify tours price here in a sec and so all thats missing os tour ID:
    client_reference_id: req.params.tourId,

    // INFORMATION ABOUT THE PRODUCT
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        //These imgs here need to be live imgs, imgs that are hosted on internet. cz stripe will actually upload this images to their own server.
        //And so this is another things that we can only really do once the website is deployed.
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, //expected in cents
        currency: 'inr',
        quantity: 1, //1 tour in this case.
      },
    ],
  })

  // 3) Send the session as resoponse.
  res.status(200).json({
    status: 'success',
    session,
  })
})

//fn that will create the new booking in the DB.
//ITs called createBookingCheckout cZ later we will also have createBooking() which will then be accessible from our bookings API
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query

  if (!tour && !user && !price) return next()

  await Booking.create({ tour, user, price })

  //redirect create a new req to the new url that we passed.
  //here we remove the queryString inorder to not see the url by the user.
  res.redirect(req.originalUrl.split('?')[0])
})
