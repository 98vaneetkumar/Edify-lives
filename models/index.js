const Sequelize = require("sequelize");
const sequelize = require("../dbConnection").sequelize;

module.exports = {
  userModel: require("./userModel")(Sequelize, sequelize, Sequelize.DataTypes),
  cmsModel: require("./cmsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  notificationModel:require("./notificationModel")(Sequelize, sequelize, Sequelize.DataTypes),
  contactUsModel:require("./contactUsModel")(Sequelize, sequelize, Sequelize.DataTypes),
};
 