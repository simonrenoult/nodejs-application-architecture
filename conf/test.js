const pkg = require("../package");

module.exports = {
  appname: pkg.name,
  db: {
    username: "nodejs_beyond",
    password: "nodejs_beyond",
    database: "nodejs_beyond_test",
    sequelize: {
      dialect: "sqlite",
      logging: false,
      storage: "./data.db"
    }
  }
};
