const path = require("path");
const express = require("express");
const bunyan = require("bunyan");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const Joi = require("joi");

const env = process.env.NODE_ENV || "development";
const conf = require(path.resolve(__dirname, "conf", env));
const Op = Sequelize.Op;

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

const Order = sequelize.define("order", {
  status: {
    type: Sequelize.ENUM("pending", "cancelled", "paid"),
    defaultValue: "pending"
  },
  shipment_amount: {
    type: Sequelize.INTEGER,
    defaultValue: 25
  },
  total_amount: Sequelize.INTEGER,
  total_weight: Sequelize.INTEGER
});

Order.hasMany(Product, { as: "ProductList" });

const orderSchema = Joi.object().keys({
  product_list: Joi.array()
    .items(Joi.number())
    .required()
});

const Bill = sequelize.define("bill", {
  total_amount: Sequelize.INTEGER
});

function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = async () => {
  const app = express();
  await sequelize.sync({});

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

    await sleep(100);
    const product = await Product.create(req.body);
    res.set("Location", `/products/${product.id}`);
    res.status(201).send();
  });

  app.get("/products", async (req, res) => {
    await sleep(50);
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
    await sleep(50);
    const product = await Product.findById(id);
    if (!product) return res.status(404).send();
    return res.status(200).send(product.toJSON());
  });

  app.delete("/products", async (req, res) => {
    await sleep(50);
    const productList = await Product.findAll();
    productList.forEach(product => product.destroy());
    res.status(204).send();
  });

  app.post("/orders", async (req, res) => {
    const { error } = Joi.validate(req.body, orderSchema, {
      abortEarly: false
    });

    if (error) {
      const errorMessage = error.details.map(({ message, context }) =>
        Object.assign({ message, context })
      );
      return res.status(400).send({ data: errorMessage });
    }

    await sleep(50);
    const productList = await Product.findAll({
      where: {
        id: { [Op.in]: req.body.product_list.map(id => parseInt(id, 0)) }
      }
    });

    if (productList.length === 0) {
      return res.status(400).send({
        data: [
          { message: "Unknown products", context: { key: "product_list" } }
        ]
      });
    }

    const productListData = productList.map(product => product.toJSON());

    const orderTotalWeight = productListData
      .map(p => p.weight)
      .reduce((prev, cur) => prev + cur, 0);

    const orderProductListPrice = productListData
      .map(p => p.price)
      .reduce((prev, cur) => prev + cur, 0);

    const SHIPMENT_PRICE_STEP = 25;
    const SHIPMENT_WEIGHT_STEP = 10;
    const orderShipmentPrice =
      SHIPMENT_PRICE_STEP * Math.round(orderTotalWeight / SHIPMENT_WEIGHT_STEP);

    let totalAmount = orderProductListPrice + orderShipmentPrice;
    if (totalAmount > 1000) {
      totalAmount = totalAmount * 0.95;
    }

    const orderData = Object.assign(
      {
        total_amount: totalAmount,
        shipment_amount: orderShipmentPrice,
        total_weight: orderTotalWeight
      },
      { product_list: req.body.product_list }
    );

    await sleep(100);
    const order = await Order.create(orderData);
    res.set("Location", `/orders/${order.id}`);
    res.status(201).send();
  });

  app.get("/orders", async (req, res) => {
    await sleep(50);
    let orderList = await Order.findAll();
    const { sort } = req.query;
    orderList = orderList.sort((a, b) => {
      if (a[sort] < b[sort]) return -1;
      if (a[sort] > b[sort]) return 1;
      return 0;
    });
    res.status(200).send(orderList);
  });

  app.get("/orders/:id", async (req, res) => {
    const { id } = req.params;
    await sleep(50);
    const order = await Order.findById(id);
    if (!order) return res.status(404).send();
    return res.status(200).send(order.toJSON());
  });

  app.delete("/orders", async (req, res) => {
    await sleep(50);
    const orderList = await Order.findAll();
    orderList.forEach(order => order.destroy());
    res.status(204).send();
  });

  app.put("/orders/:id/status", async (req, res) => {
    const { id } = req.params;
    await sleep(50);
    const order = await Order.findById(id);
    if (!order) return res.status(404).send();

    const { status } = req.body;
    if (!["pending", "paid", "cancelled"].includes(status)) {
      return res.status(400).send();
    }

    if (status === "paid") {
      await sleep(100);
      Bill.create({ total_amount: order.toJSON().total_amount });
    }

    await sleep(100);
    await order.update({ status });

    return res.status(200).send();
  });

  app.get("/bills", async (req, res) => {
    await sleep(50);
    let billList = await Bill.findAll();
    res.status(200).send(billList);
  });

  app.delete("/bills", async (req, res) => {
    await sleep(50);
    const billList = await Bill.findAll();
    billList.forEach(bill => bill.destroy());
    res.status(204).send();
  });

  return app;
};
