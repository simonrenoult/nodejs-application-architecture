const configuration = require("./src/infrastructure/configuration");
const logger = require("./src/infrastructure/logger")(configuration);
const database = require("./src/infrastructure/database")(configuration);
const models = require("./src/infrastructure/models")(database);
const schemas = require("./src/infrastructure/schemas")();
const middlewares = require("./src/infrastructure/middlewares")(logger);
const services = require("./src/infrastructure/services")(models, schemas);
const router = require("./src/infrastructure/router")(services);
const server = require("./src/infrastructure/server")(middlewares, router);

module.exports = async () => {
  await database.sync();
  return server;
};
