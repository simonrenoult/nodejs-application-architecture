const path = require("path");

const env = process.env.NODE_ENV || "development";
const logLevel = process.env.LOG_LEVEL || "info";
const confFromFile = require(path.resolve(__dirname, "..", "conf", env));

const configuration = {
  ...confFromFile,
  env,
  logLevel
};

module.exports = configuration;
