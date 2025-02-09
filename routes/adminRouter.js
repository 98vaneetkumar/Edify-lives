var express = require("express");
var router = express.Router();
const controller = require("../controllers/index");
const { session } = require("../helpers/commonHelper.js");

module.exports = function () {
  router.get("/", controller.adminController.login_page);
  router.get("/login", controller.adminController.login_page);
  router.post("/Login", controller.adminController.login);
  router.post("/logout", controller.adminController.logout);
  router.get("/dashboard", session, controller.adminController.dashboard);

  // router.post('/logout', authentication, controller.adminController.logout);

  router.get("/aboutUs", session, controller.adminController.aboutUs);
  router.post("/about_post", controller.adminController.about_post);

  router.get(
    "/privacyPolicy",
    session,
    controller.adminController.privacyPolicy
  );
  router.post("/privacy_post", controller.adminController.privacy_post);

  router.get(
    "/termsConditions",
    session,
    controller.adminController.termsConditions
  );
  router.post(
    "/termsConditionsPost",
    controller.adminController.termsConditionsPost
  );

  router.get("/users_listing", controller.adminController.users_listing);
  router.get("/user_view/:id", controller.adminController.user_view);
  router.post("/user_status", controller.adminController.user_status);
  router.post("/user_delete", controller.adminController.user_delete);

  router.post("/test", controller.adminController.test);

  return router;
};
