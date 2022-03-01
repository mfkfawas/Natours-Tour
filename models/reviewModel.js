const mongoose = require('mongoose')
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
  review: {
    type: 'String',
    required: [true, 'Review cannot be empty!'],
  },
  rating: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A review must belong to a tour.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A review must belong to a user.'],
  },
})

//Chapter 170
reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
  //want to call populate() twice when u want to populate two field
  //eventhough we select: name, some other fields will also returned due to pre-find middlewares.
  // this.populate({ path: 'tour', select: 'name' }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // }) // we turn off this populate cz when accessing a single tour, reviews are also populated, so inside that review
  //field we don't want the corr tour details again'

  this.populate({ path: 'user', select: 'name photo' })

  next()
})

// Chapter 168
// In static method, this points to the current model.(rem we need to call the aggregate on the model directly.)
//Thats why we using the static method in the 1st place, bcz this now points to the model model & we need to call
//the aggregate on the model.
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //Into aggregate() we need to pass in an array of all the stages that we want in aggregate.
  //this.aggregate() returns a promise.
  const stats = await this.aggregate([
    {
      //1st select all the reviews that belong to the curr tour.
      $match: { tour: tourId },
    },
    {
      //2nd- Calculate the statistics.
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ])

  //we wrapped this if over await bcz otherwise if the last review of a corr tour is deleted, the $match stage would
  //not then match any doc & the else is exec.(In else block we set the default ratingsAverage & ratingsQuantity to 0
  //bcz in that case reviews exist for corr tour.)  - Chapter 169
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    })
  }
}

//Chapter 168
//post middleware doesn't get next()
reviewSchema.post('save', function () {
  // 1) this points to the current review.

  // 2) we calling this.constructor() here bcz, at this point in the code, Review variable is not defined. You might think
  //    the simple solution is to move this middleware fn after the Review declaration, but unfortunately thats not going
  //    to work, bcz jst like express the code here runs in the sequence it is declared. So if we put this middleware fn
  //    after the Review declaration, Then the reviewSchema would not contain this middleware, bcz we would then only
  //    declaring this fn after the Review model was already created.

  // 3) this.constructor() points to the model, coz 'this' points to the current document & the constructor of document
  //    is the model who created that document.

  // 4) Static methods are available on the model.
  this.constructor.calcAverageRatings(this.tour)
})

//Chapter 169
// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   // we want to pass this data from this pre-mid to the next post-mid. i.e we created a property on this keyword.
//   this.r = await this.findOne() //this.r will be null if unexisting review is deleted or updated.
//   console.log(this.r)

//   next()
// })

//Chapter 169
// Here is actually where we calc the statistics of reviews.
// reviewSchema.post(/^findOneAnd/, async function () {
//   //await this.findOne() - This does not work here bcz the query has already exec.(I think Jonas is wrong in this line)
//   //Also when unexisting review is deleted or updated., the corr error is returned: Cannot read properties of null (reading 'constructor'),
//   //In the above error message null points to this.r
//   await this.r.constructor.calcAverageRatings(this.r.tour)
// })

//FIXME:
//The pre and post middleware just above this lines are methods of Jonas which is not the simplest. So Both of
//its functionality is implemented in the below post middleware by Q&A guy.

//Chapter 169(Calculate Average Ratings on tour Part-2) Q&A
//In post query middleware, we get "doc" parameter which is nothing but the executed document.
//Like I mentioned earlier, Jonas said that this.findOne() will not work inside post query middleware.
//Actually, it will work now.(word of Q&A guy)
reviewSchema.post(/^findOneAnd/, async (doc) => {
  // if doc is null then a "No document found with that Id" 404 error message is returned,
  //rather a 500 system error...
  if (doc) await doc.constructor.calcAverageRatings(doc.tour)
})

const Review = mongoose.model('Review', reviewSchema)
module.exports = Review
