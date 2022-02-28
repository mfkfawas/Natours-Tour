const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: ['true', 'A Booking Must have a Tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: ['true', 'A Booking Must have a User'],
    },

    price: {
      type: Number,
      required: ['true', 'A Booking Must have a Price'],
    },

    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  })
})

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking
