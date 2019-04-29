const Sequelize = require("sequelize");

function models(database) {
  const bill = database.define("bill", {
    total_amount: Sequelize.INTEGER
  });

  return bill;
}

module.exports = models;
