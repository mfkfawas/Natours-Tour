const express = require('express')
const reviewController = require('../controllers/reviewController')
const authController = require('../controllers/authController')

//each router by default have only access to the parameters of their specific routes. But here in this
//route, we have no access to the tourId parameter, but we still want to access the tourId parameter that
//was in the tourRoutes.js, so inorder to get that in this other router, we need to merge the parameters.
//That what mergeParams: true does.
const router = express.Router({ mergeParams: true }) //will create a prpty 'tourId' on req.params

// POST /tour/53454/reviews
// GET /tour/53454/reviews
// GET /tour/53454/reviews/ds454

//Protects all the routes after this middleware //Chapter 165
router.use(authController.protect)

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  )

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('users', 'admin'), //Chapter 165
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('users', 'admin'), //Chapter 165
    reviewController.updateReview
  )

module.exports = router
