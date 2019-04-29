const Sequelize = require("sequelize");

function models(database) {
  const product = database.define("product", {
    name: Sequelize.STRING,
    price: Sequelize.INTEGER,
    weight: Sequelize.INTEGER
  });

  const order = database.define("order", {
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

  order.hasMany(product, { as: "ProductList" });

  const bill = database.define("bill", {
    total_amount: Sequelize.INTEGER
  });

  return { bill, product, order };
}

module.exports = models;
