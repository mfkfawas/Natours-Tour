const Tour = require('../models/tourModel')
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
