const Message = require('../models/message');
const {handleError} = require("../error/error");

exports.getMail = (req, res, next) => {

    let message = req.flash('message');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('message/feedback', {
        path: '/feedback',
        pageTitle: 'Feedback',
        successMessage: message,
    });
};

exports.postMail = (req, res, next) => {

    const {email, subject, message} = req.body;
    const feedback = new Message({
        email,
        subject,
        message
    });
    return feedback.save()
        .then(result => {
            req.flash('message', 'Message was sent');
            res.redirect('/feedback');
        })
        .catch(err =>  handleError(err, 500, next));
}