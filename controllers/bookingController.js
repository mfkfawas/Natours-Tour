//In backend for stripe: we want to download stripe package, require('stripe') gives a fn, so we passed our key to that fn.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Tour = require('../models/tourModel')
const User = require('../models/userModel')
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
    // success_url: `${req.protocol}://${req.get('host')}/?my-tours=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,

    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    //url tha will be called if user cancels the payment.
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    //this field allow us to pass in some data about the session that we are currently creating. Tha imp cz later once the purchase was successful,
    //we will then get access to the session obj again. And by then we want to create a new booking in our DB. Even though that work in prod mode,
    //lets prepare for that. So to create a new booking in our DB, we need user's ID tour's ID and the price. Here we already have access to user's
    //email(we can get users ID from that). We will also specify tours price here in a sec and so all thats missing os tour ID:
    client_reference_id: req.params.tourId,
    mode: 'payment',

    // INFORMATION ABOUT THE PRODUCT
    line_items: [
      {
        quantity: 1, //1 tour in this case.
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, //expected in cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            //These imgs here need to be live imgs, imgs that are hosted on internet. cz stripe will actually upload this images to their own server.
            //And so this is another things that we can only really do once the website is deployed.
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
        },
      },
    ],
  })

  // 3) Send the session as resoponse.
  res.status(200).json({
    status: 'success',
    session,
  })
})

//Chapter 214
//fn that will create the new booking in the DB.
//ITs called createBookingCheckout cZ later we will also have createBooking() which will then be accessible from our bookings API
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query

//   if (!tour && !user && !price) return next()

//   await Booking.create({ tour, user, price })

//redirect create a new req to the new url that we passed.
//here we remove the queryString inorder to not see the url by the user.
//   res.redirect(req.originalUrl.split('?')[0])
// })

//Using this session data we can create our new booking in the database.
const createBookingCheckout = async (session) => {
  //tour, user, price is available on this session coz on getCheckoutSession(look above) we specified client_reference_id
  //field and added tourId to that.
  const tour = session.client_reference_id
  const user = (await User.findOne({ email: session.customer_email })).id
  const price = session.amount_total / 100
  await Booking.create({ tour, user, price })
}

exports.webhookCheckout = (req, res, next) => {
  //when stripe calls our webhook, it'll add a header to the req, containing special signature of our webhook.
  const signature = req.headers['stripe-signature']

  let event
  try {
    //This body here is needed in the raw form
    //All of this args are make the process super secure.
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    //If there is an error, we need to send it to stripe.
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  //rem in our stripe dashboad, this is the type we defined there.
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object)

  res.status(200).jsom({ recieved: true })
}

exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)
