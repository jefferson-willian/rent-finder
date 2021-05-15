const mailer = require('nodemailer-promise');

class EmailSender {
  constructor() {
    this.sendMail_ = mailer.config({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_SENDER_PASSWORD
      }
    });

    this.subject_ = 'Rent Finder';
  }

  getMessage_(results) {
    var html = ""
    results.forEach((result) => {
      html = html + "<h2>" + result.searchName + "</h2><ul>";
      result.newRents.map(rent => {
        html = html + "<li><a href='" + rent + "'>" + rent + "</a></li>";
      });
      html = html + "</ul>";
    });
    return html;
  }

  sendEmailResults(results) {
    return this.sendMail_({
      from: process.env.EMAIL_SENDER,
      to: process.env.EMAIL_TO,
      subject: this.subject_,
      html: this.getMessage_(results)
    });
  }
}

module.exports = {
  EmailSender
}
