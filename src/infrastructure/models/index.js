function models(database) {
  const bill = require("./bill")(database);
  const product = require("./product")(database);
  const order = require("./order")(database);

  order.associate(product);

  return { bill, product, order };
}

module.exports = models;
