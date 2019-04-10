const pkg = require("../package");

module.exports = {
  appname: pkg.name,
  db: {
    uri: process.env.DATABASE_URL,
    sequelize: {
      dialect: "postgres",
      logging: false
    }
  }
};
