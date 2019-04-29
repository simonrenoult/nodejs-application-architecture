const configuration = require("./src/configuration");
const logger = require("./src/logger")(configuration);
const database = require("./src/database")(configuration);
const models = require("./src/models")(database);
const schemas = require("./src/schemas")();
const middlewares = require("./src/middlewares")(logger);
const services = require("./src/services")(models, schemas);
const router = require("./src/router")(services);
const server = require("./src/server")(middlewares, router);

module.exports = async () => {
  await database.sync();
  return server;
};
