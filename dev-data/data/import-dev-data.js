//This file is independent from express application. Only run once in the beginning,
//to load JSON data to our DB
const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config({ path: './config.env' })
const Tour = require('../../models/tourModel')
const User = require('../../models/userModel')
const Review = require('../../models/reviewModel')

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
)
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection established :)'))

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
)

// IMPORT DATA INTO DATABASE(tours collection)
const importData = async () => {
  try {
    //prev we passed object, but the create method can also accept an array of objects.
    //In that case it will simply then create a new document for each of objs in the
    // array.
    await Tour.create(tours)
    await User.create(users, { validateBeforeSave: false }) //With this all of the validation in the model will be skipped.
    await Review.create(reviews)
    console.log('Data succesfully loaded from the files to the collections')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

//DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany()
    await User.deleteMany()
    await Review.deleteMany()
    console.log('Data succesfully deleted from the collections.')
  } catch (err) {
    console.log(err)
  }
  process.exit()
}

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData()
}

// node ./dev-data/data/import-dev-data.js --delete
