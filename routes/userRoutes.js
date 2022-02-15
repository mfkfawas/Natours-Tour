const express = require('express')

const userController = require('../controllers/userControllers')
const authController = require('../controllers/authController')

const router = express.Router()

//Public routes
router.post('/signup', authController.signUp)
router.post('/login', authController.login)
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

//protect all the routes that comes after this line. This middleware will only call next()
//if the user is authenticated. So all of the middlewares comes after this is protected.
//In other words, it Protects all the routes after this middleware.
// Chapter 165
router.use(authController.protect)

//Protected routes
router.patch('/updateMyPassword', authController.updatePassword)

router.get('/me', userController.getMe, userController.getUser)

router.patch('/updateMe', userController.updateMe)
router.delete('/deleteMe', userController.deleteMe)

//Only admins can access all the routes after this middleware.
router.use(authController.restrictTo('admin'))

//Protected & Restricted routes.
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser)

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router
