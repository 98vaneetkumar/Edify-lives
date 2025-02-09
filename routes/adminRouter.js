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

  router.get("/churches_listing", controller.adminController.churches_listing);
  router.get("/church_view/:id", controller.adminController.church_view);
  router.post("/church_status", controller.adminController.church_status);
  router.post("/church_delete", controller.adminController.church_delete);

  router.get("/business_listing", controller.adminController.business_listing);
  router.get("/business_view/:id", controller.adminController.business_view);
  router.post("/business_status", controller.adminController.business_status);
  router.post("/business_delete", controller.adminController.business_delete);

  router.get("/nonprofit_listing", controller.adminController.nonprofit_listing);
  router.get("/nonprofit_view/:id", controller.adminController.nonprofit_view);
  router.post("/nonprofit_status", controller.adminController.nonprofit_status);
  router.post("/nonprofit_delete", controller.adminController.nonprofit_delete);

  router.post("/test", controller.adminController.test);

  return router;
};
