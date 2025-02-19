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
  router.get('/getDashboardData', session, controller.adminController.getDashboardData);


  router.get("/profile", controller.adminController.profile);
  router.post("/profile_update/:id", controller.adminController.profile_update);
  router.get("/change_password", controller.adminController.change_password);
  router.post(
    "/change_password_post",
    controller.adminController.change_password_post
  );

  router.get("/aboutUs", session, controller.adminController.aboutUs);
  router.post("/about_post", session, controller.adminController.about_post);

  router.get(
    "/privacyPolicy",
    session,
    controller.adminController.privacyPolicy
  );
  router.post(
    "/privacy_post",
    session,
    controller.adminController.privacy_post
  );

  router.get(
    "/termsConditions",
    session,
    controller.adminController.termsConditions
  );

  router.post(
    "/termsConditionsPost",
    session,
    controller.adminController.termsConditionsPost
  );

  router.get(
    "/users_listing",
    session,
    controller.adminController.users_listing
  );
  router.get("/user_view/:id", session, controller.adminController.user_view);
  router.post("/user_status", session, controller.adminController.user_status);
  router.post("/user_delete", session, controller.adminController.user_delete);

  router.get("/churches_listing", controller.adminController.churches_listing);
  router.get("/church_view/:id", controller.adminController.church_view);
  router.post("/church_status", controller.adminController.church_status);
  router.post("/church_delete", controller.adminController.church_delete);

  router.get("/business_listing", controller.adminController.business_listing);
  router.get("/business_view/:id", controller.adminController.business_view);
  router.post("/business_status", controller.adminController.business_status);
  router.post("/business_delete", controller.adminController.business_delete);

  router.get(
    "/nonprofit_listing",
    controller.adminController.nonprofit_listing
  );
  router.get("/nonprofit_view/:id", controller.adminController.nonprofit_view);
  router.post("/nonprofit_status", controller.adminController.nonprofit_status);
  router.post("/nonprofit_delete", controller.adminController.nonprofit_delete);



  router.get("/subscription_listing", controller.adminController.subscription_listing);
  router.get("/subscription_add", controller.adminController.subscription_add);
  router.post("/subscription_create", controller.adminController.subscription_create);
  router.post("/subscription_status", controller.adminController.subscription_status);
  router.post("/subscription_delete", controller.adminController.subscription_delete);
  router.get("/subscription_edit/:id", controller.adminController.subscription_edit);
  router.post("/subscription_update", controller.adminController.subscription_update);


  router.get("/banner_listing", controller.adminController.banner_listing);
  router.get("/banner_add", controller.adminController.banner_add);
  router.post("/banner_create", controller.adminController.banner_create);
  router.post("/banner_delete", controller.adminController.banner_delete);
  router.get("/banner_edit/:id", controller.adminController.banner_edit);
  router.post("/banner_update", controller.adminController.banner_update);



  router.post("/test", controller.adminController.test);

  return router;
};

