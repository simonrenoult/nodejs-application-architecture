function middlewares(logger) {
  return { logRequest };

  function logRequest() {
    return (req, res, next) => {
      logger.debug({
        method: req.method,
        host: req.headers.host,
        url: req.url,
        useragent: req.headers["user-agent"]
      });
      next();
    };
  }
}

module.exports = middlewares;
