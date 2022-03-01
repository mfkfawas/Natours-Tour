const express = require('express')
const bookingController = require('../controllers/bookingController')
const authController = require('../controllers/authController')

const router = express.Router()

router.use(authController.protect)

//This route is not following the rest principle, this route is only for the clients to get a checkout session
router.get(
  //we want client to send along the ID of tour that is currently being booked, so we can fill up the checkout session with all the data that is
  //necessary such as tour name,...
  '/checkout-session/:tourId',
  bookingController.getCheckoutSession
)

router.use(authController.restrictTo('admin', 'lead-guide'))

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking)

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking)

module.exports = router
