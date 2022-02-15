const mongoose = require('mongoose')
const slugify = require('slugify')
// const validator = require('validator')
const User = require('./userModel')

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name.'],
      maxlength: [40, 'A tour name must have less or equal to 40 characters.'],
      minlength: [10, 'A tour name must have more or equal to 40 characters.'],
      //validator.isAlpha is a validator fn, we dont call it here, just specify.
      //This validator returns false(error) if the entered string contains spaces or if it doesnt contain
      //numbers, so not useful here.
      // validate: [validator.isAlpha, 'Tour name must only contain characters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a max tour size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //Chapter 170
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only point to current doc on NEW document creation.
          return val < this.price
        },
        //{VALUE} is mongoose notation to the value that is inputted.
        message: 'Discount price ({VALUE}) should be below regular price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    //embedding documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        description: String,
        day: Number,
      },
    ],
    //Child referencing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: User,
      },
    ],
  },
  //These are options. These options means that, when we have a virtual property, basically a field that is not stored in the database but
  //calculated using some fields. Also we want to also show up the calculated whenever there is an output.
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Chapter 167
// 1 means ascending, -1 means descending
// tourSchema.index({ price: 1 })
tourSchema.index({ price: 1, ratingsAverage: -1 })

//we want to use the unique slug to query for tours. i.e slug will become one of the most queried field.
tourSchema.index({ slug: 1 })

//Chapter 171
tourSchema.index({ startLocation: '2dSphere' })

//VIRTUAL PROPERTY
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

//virtual populate(Chapter 157)
tourSchema.virtual('reviews', {
  ref: 'Review', //virtual reference
  foreignField: 'tour',
  localField: '_id',
})

// DOCUMENT MIDDLEWARE: runs before only .save() and .create() but not triggered by any other mongoose methods.
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})

//embedding guides:
// tourSchema.pre('save', async function (next) {
//we know that an async fn always returns promises.
// const guidesPromises = this.guides.map(async (id) => await User.findById(id))
//now this.guides will be overrided with an array of user documents from an array of IDs.
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })

//In post middlewarehas not only access to next() but also to document that just saved.
// tourSchema.post('save', function (doc, next) {
//   console.log(doc)
//   next()
// })

// QUERY MIDDLEWARE
//this pre-find hook, a middleware thats gonna run before any find query is executed.
// /^find/ means any word starting with 'find', oherwise if any query like findOne is executed without
// entering to this middleware. So in such case secret tour accessed by ohterthan .find() will shows
// the result.
tourSchema.pre(/^find/, function (next) {
  //this here is an query object, so we can chain all of the methods that we have for queries.
  this.find({ secretTour: { $ne: true } })

  // this.start = Date.now()
  next()
})

tourSchema.pre(/^find/, function (next) {
  this.populate({
    //The field in the model.
    path: 'guides',
    //These two fields will not be in the result.
    select: '-__v -passwordChangedAt',
  })
  next()
})

//This post-find hook exec after any find query is executed.
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(
//     `Query took ${Date.now() - this.start} milliseconds to get executed.`
//   )
//   next()
// })

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  //here this point to the current aggregation object.
  //this.pipeline() - the array that we passed into the aggregation fn before.
  // console.log(this.pipeline())

  //Inorder to filter out the secret tours all we have to do is to add another match stage at the
  //beginning of the pipeline array.

  // Hide secret tours if geoNear is NOT used(The idea is simply to check if the pipeline's object is not empty and if '$geoNear' is the first key.)
  //For more about this if, Chapter 172.
  if (
    !(
      this.pipeline().length > 0 &&
      Object.keys(this.pipeline().at(0))[0] === '$geoNear'
    )
  ) {
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } },
    })
  }
  next()
})

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
