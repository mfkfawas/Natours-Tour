//All the fns related to authentication controller.
const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Email = require('../utils/email')
const { globalAgent } = require('http')

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  global.token = token

  // const cookieOptions = {
  // expires: new Date(
  // Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  // ),
  // httpOnly: true,
  // sameSite: 'None',
  // secure: true,
  // }
  // console.log(token)
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

  // res.cookie('jwt', token, cookieOptions)

  user.password = undefined

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
    },
  })
}

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  })

  const url = `${req.protocol}://${req.get('host')}/me`

  await new Email(newUser, url).sendWelcome()

  createAndSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  // 1) Check if email and password exist.
  if (!email || !password)
    return next(new AppError('Please provide email & password'), 400)

  // 2) Check user exists && password is correct
  //.select() - to explicitly select a field. '+password' - + denotes the field is defaultly not selected.(select: false)
  const user = await User.findOne({ email }).select('+password')

  //user.correctPassword() is an instance method(look userModel.js)
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect Email or Password', 401)) //401 -uanuthorized.

  // 3) If everything is OK, send token to the client.
  createAndSendToken(user, 200, res)
})

// Chapter 192
exports.logout = catchAsync(async (req, res, next) => {
  global.token = 'SOmeDummyText'

  // res.cookie('jwt', 'someDummyText', {
  //   expires: new Date(Date.now + 10 * 1000),
  //   httpOnly: true,
  //   //we donot need to set it as secure coz here no sensitive data.
  // })
  res.status(200).json({ status: 'success' })
})

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token & check if its there.
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
    // Chapter 189 - now we can authenticate users based on the tokens sent via cookies.
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token)
    return next(
      new AppError('You are not logged in!!! Please login to get access', 401)
    )

  // 2) Verification token - JWT algorithm verifies if the signature is valid or not.
  //look chapter 131 Q&A
  //if this promise get rejected we pass it into our global error handling middleware(err.name === 'JsonWebTokenError')
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  // console.log(decoded)

  // 3) Check if user still exists.(what if user deleted meantime?So the token would still exist, but if user
  //is no longer existent.)
  const currentUser = await User.findById(decoded.id)
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token is no longer exist!', 401)
    )

  // 4) Check if the user changed password after the token was issued. (what if user has actually changed his password after the token has
  //been issued? Imagine that someone stole the JWT from a user, Inorder to protect that user changed his
  //password & so the old token that was issued before the password changed should no longer be valid.)
  if (await currentUser.changedPasswordAfterTokenIssued(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again.', 401)
    )
  }

  //if code can make to all to the end of this code, only then next will be executed. i.e we go to the next
  //route handler, which means to grant access to that protected route.
  req.user = currentUser
  res.locals.user = currentUser
  next()
})

// Chapter 190
// This middleware is only for rendered pages. so the goal is not to protect any routes.
// so there will never be error in this middleware.

// If any of this fn's step is confusing, look above protect fn.

// This fn is not wrapped in catchAsync coz when user logout the site reload(look login.js)
// so when site reload this middleware is exec, if wrapped in catchAsync() then when verifying
// token(in this fn) it will be malformed and pass to our global error handler. That should not
// happen cz this fn is only to render the name & photo of user in header if logged in, else
// render login & signup buttons.
exports.isLoggedIn = async (req, res, next) => {
  try {
    let token

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]

      // Chapter 189 - now we can authenticate users based on the tokens sent via cookies.
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt
    }

    // 1) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded)

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return next()
    }

    // 3) Check if user changed password after the token was issued
    if (await currentUser.changedPasswordAfterTokenIssued(decoded.iat)) {
      return next()
    }
    // console.log(currentUser)

    // if THERE IS A LOGGED IN USER(Then we can give access to our templates)
    // pug template get access to the variable that we set with res.locals(imp)
    // Now inside of the template there will be a variable called user.
    res.locals.user = currentUser
    return next()
  } catch (err) {
    // if there is no logged in user.
    return next()
  }

  next()
}

//Ussually we cant pass arguments to middleware fn, but here we really want to, we want to pass in the roles,
// who are allowed to access the resource.
exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    //req.user is setted on 'protect' middleware, & protect middleware runs before this 'restrictTo' middleware
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403) //403 - Forbidden
      )

    next()
  }
}

//Chapter(134)
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email })

  if (!user)
    return next(new AppError('There is no user with that email address!', 404))

  // 2) Generate the random reset token.
  const resetToken = await user.createPasswordResetToken()
  //On user.createPasswordResetToken() we just modified the data but that data is not persisted to the database
  //so we need to save it.
  //Here we passed an option bcz, we're trying to save a document but we donot specify all of the
  //the mandatory data that is the field that we marked as required.
  await user.save({ validateBeforeSave: false }) //This will deactivate all the validators that we specified in our schema.

  // 3) Send it to the user's email.

  //There might happen an error by sendEmail(), so in that case we want to send an error message to the user,
  //Also in this case we actually want to do more than sending an error message. We need to setback the
  //the passwordResetToken and passwordResetExpires. So right now it is not enough to catch the error and then
  //send it down to our global error handler. So we use a try-catch block.
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your Password Reset Token(Valid for 10min)',
    //   message,
    // })
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`

    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(
      new AppError(
        'There was an error sending the email. Please try again later!',
        500
      )
    )
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  //we want to check if the passwordResetExpires property is greater than right now(time), which means it
  //hasnt expired yet.
  //Date.now() wil be a timestamp of right now, gut behind the scenes mondoDB will then convert everything to
  //the same & therefore be able to compare them actually.
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  // 2) If token has not expired, and there is user, set the new password,
  if (!user) return next(new AppError('Token has expired or is invalid!', 400))

  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save() //here we dont want to turn off the validator, bcz we want to validate, we want validator to confirm if the password is equal to passwordConfirm.

  // 3) Update changePasswordAt property of the user
  //we added userSchema.pre('save') middleware for 3rd step.

  // 4) Log the user in, send the JWT.
  createAndSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user from the collection.
  const user = await User.findById(req.user.id).select('+password')

  // 2) Check if the POSTed password is correct.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('The password you entered does not match!', 401))

  // 3) If so, update the password.
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save() //passwordChangedAt will automatically updated bcz we added userSchema.pre('save') middleware.
  //User.findByIdAndUpdate will not work as intended.

  // 4) Log the user in, send the JWT.
  createAndSendToken(user, 200, res)
})
