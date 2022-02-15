//Its a good practice to have everything that is related to server in one file(main) and
//everything that related to express in another file(app.js).
//This is the entry point. It is
const mongoose = require('mongoose')
const dotenv = require('dotenv')

//This event-listener for sync code should be registered on top.
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🤢🤢🤢. Shutting down!!!!')
  console.log(err.name, err.message)
  process.exit(1)
})

dotenv.config({ path: './.env' })
const app = require('./app')

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

//console.log(process.env)

const port = process.env.PORT || 3000

//result of calling app.listen() is a server.
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

//(Chapter 121)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 🤢🤢🤢. Shutting down!!!!')
  console.log(err.name, err.message)
  //Shutting down abruptly.
  // process.exit(1) // 0 stands for success, 1 stands for unacaught exception.

  //Shuttin down gracefully. 1)close the server 2)shutdown the app.
  //server.close() - giving server basically time to finish all request that are pending or being handled at the time,
  //and only after that server is killed
  server.close(() => {
    process.exit(1)
  })
})
