//The goal of this function is to simply catch our asyncronous(fns) errrors.

module.exports = function (fn) {
  return (req, res, next) => {
    //Since the passed fn will be async fn,it returns a promise.
    fn(req, res, next).catch((err) => next(err))
  }
}
