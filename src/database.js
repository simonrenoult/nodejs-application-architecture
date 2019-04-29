const Sequelize = require("sequelize");

function database(configuration) {
  if (configuration.env === "production") {
    return new Sequelize(configuration.db.uri);
  }

  return new Sequelize(
    configuration.db.database,
    configuration.db.username,
    configuration.db.password,
    configuration.db.sequelize
  );
}

module.exports = database;
