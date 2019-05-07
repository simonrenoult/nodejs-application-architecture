const bunyan = require("bunyan");

function logger(configuration) {
  return bunyan.createLogger({
    name: configuration.appname,
    level: configuration.logLevel
  });
}

module.exports = logger;
