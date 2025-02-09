var express = require("express");
var router = express.Router();
const controller = require("../controllers/index");
const {
  authentication,
  forgotPasswordVerify,
} = require("../middlewares/authentication");
const { session } = require("../helpers/commonHelper.js");

module.exports = function () {
  router.get("/", controller.adminController.login_page);
  router.get("/login", controller.adminController.login_page);
  router.post("/Login", controller.adminController.login);
  router.get("/dashboard", session, controller.adminController.dashboard);

  // router.post('/logout', authentication, controller.adminController.logout);

  router.get("/aboutUs", controller.cmsController.aboutUs);
  router.post("/about_post", controller.cmsController.about_post);
  router.get("/imprint", controller.cmsController.imprint);
  router.post("/imprint_post", controller.cmsController.imprint_post);
  router.get("/privacyPolicy", controller.cmsController.privacyPolicy);
  router.post("/privacy_post", controller.cmsController.privacy_post);
  router.get("/termsConditions", controller.cmsController.termsConditions);
  router.post(
    "/termsConditionsPost",
    controller.cmsController.termsConditionsPost
  );

  return router;
};
