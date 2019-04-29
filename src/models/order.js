const Sequelize = require("sequelize");

function order(database) {
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

  order.associate = product => {
    order.hasMany(product, { as: "ProductList" });
  };

  return order;
}

module.exports = order;
