const cors = require("cors");
const express = require("express");
const { json } = require("body-parser");

function server(middlewares, router) {
  const app = express();

  app.use(json());
  app.use(middlewares.logRequest());
  app.use(cors());

  router.route(app);

  return app;
}

module.exports = server;
