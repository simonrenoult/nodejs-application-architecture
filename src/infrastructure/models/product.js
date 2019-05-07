const Sequelize = require("sequelize");

function product(database) {
  const product = database.define("product", {
    name: Sequelize.STRING,
    price: Sequelize.INTEGER,
    weight: Sequelize.INTEGER
  });

  return product;
}

module.exports = product;
