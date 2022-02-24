const express = require('express')
const viewController = require('../controllers/viewController')
const authController = require('../controllers/authController')

const router = express.Router()

const fakeMiddleware = (req, res, next) => {
  req.headers.authorization = `Bearer ${global.token}`

  // console.log(req.headers.authorization)
  next()
}

// Chapter 190
// router.use(authController.isLoggedIn)
router.use(fakeMiddleware)

router.get('/', authController.isLoggedIn, viewController.getOverview)

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour)

router.get('/login', authController.isLoggedIn, viewController.getLoginForm)

// we dont want to add isLoggedIn here coz protect middleware do isLoggedIn's duty.
router.get('/me', authController.protect, viewController.getAccount)

module.exports = router
