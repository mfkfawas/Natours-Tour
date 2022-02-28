const nodemailer = require('nodemailer')
const pug = require('pug')

const htmlToText = require('html-to-text')

//The idea is whenever we want to send a new email, is to import this email class & then use it.
//new Email(user, url).sendWelcome() - eg for creating a new email object
//user would contain name & email,
//url - eg- the reset url for resetting password,
//also methods - the way we will set all this will make it easy to keep adding new & new methods to send diff emails for diff scenarios.
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(' ')[0]
    this.url = url
    this.from = `mfkfawas <${process.env.EMAIL_FROM}>`
  }

  //method for creating a transport
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      })
    }

    //development mode
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }

  //method which do the actual sending
  async send(template, subject) {
    // 1) Render HTML for email based on a pug template
    //we want to create the HTML out of the template so that we can send that HTML as the email.
    //This will take in the file and then render the pug code into real HTML.
    //2nd arg is data to be passed to the template.
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    })

    // 2) Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    }

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions)
  }

  //whenever we call this fn 'welcome' template is used
  async sendWelcome() {
    //welcome - template name, 2nd arg - subject
    await this.send('welcome', 'Welcome to the Natours Family!')
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    )
  }
}
