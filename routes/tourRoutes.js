const express = require('express')
const tourController = require('../controllers/tourControllers')
const authController = require('../controllers/authController')
const reviewRouter = require('./reviewRoutes')

const router = express.Router()

// router.param('id', tourController.checkID)

// POST /tour/53454/reviews
// GET /tour/53454/reviews
// GET /tour/53454/reviews/ds454

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   )

//router is itself a middleware & we can use the use() on it & can say for this specific route here we want to use the
//reviewRouter.(Chapter 159, 160)
router.use('/:tourId/reviews', reviewRouter)

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours)

router.route('/tour-stats').get(tourController.getTourStats)

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  )

//Chapter 171
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getTourWithin)
//tours-within?distance=233&center=-40,75&unit=mi
//tours-within/233/center/-40,75/unit/mi - Jonas feels this line is more cleaner than above line.

//Chapter 172
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  )

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )

module.exports = router
