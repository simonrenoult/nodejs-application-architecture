const path = require("path");
const express = require("express");
const bunyan = require("bunyan");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const Joi = require("joi");

const env = process.env.NODE_ENV || "development";
const conf = require(path.resolve(__dirname, "conf", env));

const logLevel = process.env.LOG_LEVEL || "info";
const logger = bunyan.createLogger({ name: conf.appname, level: logLevel });

const sequelize = new Sequelize(
  conf.db.database,
  conf.db.username,
  conf.db.password,
  conf.db.sequelize
);

const Product = sequelize.define("product", {
  name: Sequelize.STRING,
  price: Sequelize.INTEGER,
  weight: Sequelize.INTEGER
});

const productSchema = Joi.object().keys({
  name: Joi.required(),
  price: Joi.required(),
  weight: Joi.required()
});

module.exports = async () => {
  const app = express();
  await sequelize.sync();

  app.use(bodyParser.json());

  app.use((req, res, next) => {
    logger.debug({
      method: req.method,
      host: req.headers.host,
      url: req.url,
      useragent: req.headers["user-agent"]
    });
    next();
  });

  app.use((req, res, next) => {
    res.set("Content-Type", "application/json");
    next();
  });

  app.post("/products", async (req, res) => {
    const { error } = Joi.validate(req.body, productSchema, {
      abortEarly: false
    });

    if (error) {
      const errorMessage = error.details.map(({ message, context }) =>
        Object.assign({ message, context })
      );
      return res.status(400).send({ data: errorMessage });
    }

    const product = await Product.create(req.body);
    res.set("Location", `/products/${product.id}`);
    res.status(201).send();
  });

  app.get("/products", async (req, res) => {
    let productList = await Product.findAll();
    const { sort } = req.query;
    productList = productList.sort((a, b) => {
      if (a[sort] < b[sort]) return -1;
      if (a[sort] > b[sort]) return 1;
      return 0;
    });
    res.status(200).send(productList);
  });

  app.get("/products/:id", async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).send();
    return res.status(200).send(product.toJSON());
  });

  app.delete("/products", async (req, res) => {
    const productList = await Product.findAll();
    productList.forEach(product => product.destroy());
    res.status(204).send();
  });

  return app;
};
