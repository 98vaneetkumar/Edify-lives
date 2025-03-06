const Sequelize = require("sequelize");
const sequelize = require("../dbConnection").sequelize;

module.exports = {
  userModel: require("./userModel")(Sequelize, sequelize, Sequelize.DataTypes),
  cmsModel: require("./cmsModel")(Sequelize, sequelize, Sequelize.DataTypes),
  notificationModel:require("./notificationModels")(Sequelize, sequelize, Sequelize.DataTypes),
  contactUsModel:require("./contactUs")(Sequelize, sequelize, Sequelize.DataTypes),
  subscriptionModel:require("./subscriptionModel")(Sequelize, sequelize, Sequelize.DataTypes),
  bannerModel:require("./bannerModel")(Sequelize, sequelize, Sequelize.DataTypes),
  heartToServeModel:require("./heartToServeModel")(Sequelize, sequelize, Sequelize.DataTypes),
  maritalStatusModel:require("./maritalStatusModel")(Sequelize, sequelize, Sequelize.DataTypes),
  numberOfMembersModel:require("./numberOfMembersModel")(Sequelize, sequelize, Sequelize.DataTypes),
  profilePreferenceModel:require("./profilePreferenceModel")(Sequelize, sequelize, Sequelize.DataTypes),
  traitsExperienceModel:require("./traitsExperienceModel")(Sequelize, sequelize, Sequelize.DataTypes),
};
 