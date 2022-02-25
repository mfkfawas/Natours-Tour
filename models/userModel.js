const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!!!'],
  },

  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    //not a validator.
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid Email.'],
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },

  role: {
    type: String,
    default: 'user',
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
    },
  },

  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      //This only works on create() and save()
      validator: function (el) {
        return el === this.password
      },
      message: 'Passwords are not the same.',
    },
  },
  passwordChangedAt: Date,

  passwordResetToken: String,

  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
})

userSchema.pre('save', async function (next) {
  //Only runs this fn if password was actually modified.
  if (!this.isModified('password')) return next()

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12)

  // Delete the password confirm field.
  //eventhough we said passwordConfirm - required in the schema, it really means its a required input not that
  //its should be persisted to the DB.
  this.passwordConfirm = undefined
})

//Update changePasswordAt property of the user
userSchema.pre('save', async function (next) {
  //this.isNew - if the document is new
  if (!this.isModified('password') || this.isNew) return next()

  //(authController.js line 196 to 200)sometime saving to the DB is a bit slower than issuing the JSON web token, making it so that the changed
  //password timestamp is sometimes set a bit after the JWT has been issued. And so that will make it so the user
  //will not be able to login using the new token.(we jst fix that by substracting one second)
  this.passwordChangedAt = Date.now() - 1000
  next()
})

// Query Middleware, the below middleware exec just before any find(find, findById,...) query.
userSchema.pre(/^find/, function (next) {
  //this keyword points to the current query.
  this.find({ active: { $ne: false } }) //now all documents other than documents which have active:false will be returned.
  next()
})

//(Chapter 128)
//The goal of this function is to really only return true or false, true if passwords are the same & false otherwise.
//We cannot compare them manually because the candidatePassword is not hashed, its the og password coming from the user.
//but userPassword is ofcourse hashed.
//Here we r creating an instance method, i.e a method available on all documents of a certain collection.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfterTokenIssued = async function (
  JWTIssuedTimeStamp
) {
  //By default, we return false from this method. And that will then mean user has'nt changed his password
  //after the token has been issued.
  if (this.passwordChangedAt) {
    const passwordLastChangedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, //converting to seconds.
      10 //base 10
    )
    return JWTIssuedTimeStamp < passwordLastChangedTimeStamp
  }

  return false
}

userSchema.methods.createPasswordResetToken = async function () {
  //The password reset token must be a random string, but doesnt need to be cryptographically strong as
  //password hash that we created before. So we can use very simple random bytes fn from crypto module.
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // +10min

  //we need to send teh unencrypted reset token.
  return resetToken
}

const User = mongoose.model('User', userSchema)
module.exports = User
