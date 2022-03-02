const express = require('express')
const viewController = require('../controllers/viewController')
const authController = require('../controllers/authController')
// const bookingController = require('../controllers/bookingController')

const router = express.Router()

// const fakeMiddleware = (req, res, next) => {
//   req.headers.authorization = `Bearer ${global.token}`

// console.log(req.headers.authorization)
//   next()
// }

// Chapter 190
// router.use(authController.isLoggedIn)

// router.use(fakeMiddleware)

router.use(viewController.alerts)

router.get(
  '/',
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
)

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour)

router.get('/login', authController.isLoggedIn, viewController.getLoginForm)

// we dont want to add isLoggedIn here coz protect middleware do isLoggedIn's duty.
router.get('/me', authController.protect, viewController.getAccount)

router.get('/my-tours', authController.protect, viewController.getMyTours)

//Chapter 195
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
)

module.exports = router
