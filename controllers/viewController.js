const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get the tour data from our collection.
  const tours = await Tour.find()

  // 2) Render that template by injecting the tour data from 1).
  res.status(200).render('overview', { title: 'All Tours', tours })
})

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  })

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404))
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  })
})

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', { title: 'Log into your account' })
}

//To get the account page all we need to do is to simply render account page(template).
//we dont need to query for the current user cz that has already done in protect middleware.
exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your Account' })
}

//Chapter 215
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find All Bookings
  const bookings = await Booking.find({ user: req.user.id })

  // 2) Find Tours with returned IDs
  const tourIDs = bookings.map((el) => el.tour._id)
  //It will select all the tours which have an _id which is in the tourIDs array. Its great to know this handi in op,
  //Jonas want to fo this way for us to understand both manual and populate(we done bfr).
  const tours = await Tour.find({ _id: { $in: tourIDs } })

  //Surely read the Q&A of chapter 215(Rendering a user's booked Tours)

  //we dont need new template for this coz we can reuse the 'overview' template.
  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  })
})

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  )
  // here we also need to pass the updated user, Otherwise the template use the user(unupdated) that
  // coming from the protect middleware.(This user property override the res.locals.user)
  res
    .status(200)
    .render('account', { title: 'Your Account', user: updatedUser })
})
