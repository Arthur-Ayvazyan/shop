exports.handleError = (err, status, next) => {
    const error = new Error(err);
    error.httpStatusCode = status;
    return next(error)
}