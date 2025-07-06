//Its a good practice to have everything that is related to server in one file(server.js) and
//everything that related to express in another file(app.js).
//This is the entry point. It is
const mongoose = require('mongoose')
const dotenv = require('dotenv')

//This event-listener for sync code should be registered on top.
// const x = y + 1  // y is not defined => will crash app
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🤢🤢🤢. Shutting down!!!!')
  console.log(err.name, err.message)
  console.log(err.stack)
  process.exit(1)
})

dotenv.config({ path: './config.env' })
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
// This catches errors in Promises (async code) that you didn’t .catch().
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

//To understand more about this read 'Responding to SIGTERM' signal in blue classmate notebook backside.
// This listens for a signal from outside the app (like Heroku or Docker) telling the app to shut down.
process.on('SIGTERM', () => {
  console.log('SIGTERM RECIEVED. Shutting down gracefully 🤢🤢🤢🤢🤢🤢')
  //graceful shutdown
  server.close(() => {
    console.log('Process Terminated🤢🤢🤢🤢🤢🤢')
    //here we donot use process.exit cz the SIGTERM itself cause the app to shutdown
  })
})
