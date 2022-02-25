const multer = require('multer')

const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

//______________________________________________MULTER_____________________________________________________________
//Chapter 200
const multerStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/img/users')
  },
  filename: (req, file, callback) => {
    const extension = file.mimetype.split('/')[1]
    //2nd arg is the unique filename of our uploading photo.
    callback(null, `user-${req.user.id}-${Date.now()}.${extension}`)
  },
})

//Chapter 200
// This fn's goal is to test if the uploaded file is an image. If so, we pass true into the
// the callback function, and if its not we pass false into the callback function along with an err.
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true)
  } else {
    callback(new AppError('Not an image! Please upload only images.'))
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
})

// 'photo' is the fieldname(of form).
exports.uploadUserPhoto = upload.single('photo')
//____________________________________________________________________________________________________________

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

exports.getMe = (req, res, next) => {
  //here we're faking the current user's id as id coming from the URL. Bcz this fn act as a middleware &
  //the next middleware is getUser() (look userRoutes.js > router.get('/me', ...)), so we can reuse that
  //factory fn(getUser)
  req.params.id = req.user.id
  next()
}

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file)
  console.log(req.body)

  // 1)--------------Create error if user POSTs password data----------------------
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    )
  //-------------------------------------------------------------------------------

  // 2) we want to filter the body and mke sure it only contain name & email.
  const filteredBody = filterObj(req.body, 'name', 'email')

  // 3)--------------------------------Update user document--------------------------------------------------------------
  //We r not passing req.body to update, coz we donot want to update everything that's in the body. For eg if
  //user puts role: 'admin' in the body then this would allow any user to change the role & ofcourse that cant be allowed.
  //Or the user could also change the resetToken or resetTokenExpires,... and all of that should not be allowed.
  //Here the runValidators:true will run the specified built-in & 3rd party validators of corr fields(remember inside author generated
  //validator fn this keyword is not accessible.)
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  })
  //--------------------------------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------------------
  //Updating using save()---The prob here is here we set validateBeforeSave:false, so if user provide invalid
  //email, it will be persisted to DB, then when user try to login using that mail, login() fn will reject it &
  //user get screwed.

  // const updateUser = await User.findById(req.user.id)
  // if (req.body.name) updateUser.name = req.body.name
  // if (req.body.email) updateUser.email = req.body.email
  // updateUser.save({ validateBeforeSave: false })
  //----------------------------------------------------------------------------------------------------------------

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })
  res.status(204).json({ status: 'success', data: null })
})

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined. Please use /signup',
  })
}

exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User)
//This fn is only for admins $ also dont update password with this fn.
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
