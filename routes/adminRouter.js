var express = require("express");
var router = express.Router();
const controller = require("../controllers/index");
const { session } = require("../helpers/commonHelper.js");

module.exports = function () {
  router.get("/", controller.adminController.login_page);
  router.get("/login", controller.adminController.login_page);
  router.post("/Login", controller.adminController.login);
  router.get("/dashboard", session, controller.adminController.dashboard);

  // router.post('/logout', authentication, controller.adminController.logout);

  router.get("/aboutUs", controller.adminController.aboutUs);


  return router;
};
