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




  router.get("/maritalstatus_listing", controller.adminController.maritalstatus_listing);
  router.get("/maritalstatus_add", controller.adminController.maritalstatus_add);
  router.post("/maritalstatus_create", controller.adminController.maritalstatus_create);
  router.post("/maritalstatus_delete", controller.adminController.maritalstatus_delete);


  router.get("/profilepreference_listing", controller.adminController.profilepreference_listing);
  router.get("/profilepreference_add", controller.adminController.profilepreference_add);
  router.post("/profilepreference_create", controller.adminController.profilepreference_create);
  router.post("/profilepreference_delete", controller.adminController.profilepreference_delete);
  


  router.get("/hearttoserve_listing", controller.adminController.hearttoserve_listing);
  router.get("/hearttoserve_add", controller.adminController.hearttoserve_add);
  router.post("/hearttoserve_create", controller.adminController.hearttoserve_create);
  router.post("/hearttoserve_delete", controller.adminController.hearttoserve_delete);
  


  router.get("/numberofmembers_listing", controller.adminController.numberofmembers_listing);
  router.get("/numberofmembers_add", controller.adminController.numberofmembers_add);
  router.post("/numberofmembers_create", controller.adminController.numberofmembers_create);
  router.post("/numberofmembers_delete", controller.adminController.numberofmembers_delete);
  

  router.get("/traitsexperience_listing", controller.adminController.traitsexperience_listing);
  router.get("/traitsexperience_add", controller.adminController.traitsexperience_add);
  router.post("/traitsexperience_create", controller.adminController.traitsexperience_create);
  router.post("/traitsexperience_delete", controller.adminController.traitsexperience_delete);
  
  router.get("/filterTestimonies_listing", controller.adminController.filterTestimonies_listing);
  router.get("/filterTestimonies_add", controller.adminController.filterTestimonies_add);
  router.post("/filterTestimonies_create", controller.adminController.filterTestimonies_create);
  router.post("/filterTestimonies_delete", controller.adminController.filterTestimonies_delete);

  router.get("/prayerrequest_listing", controller.adminController.prayerrequest_listing);
  router.get("/prayerrequest_add", controller.adminController.prayerrequest_add);
  router.post("/prayerrequest_create", controller.adminController.prayerrequest_create);
  router.post("/prayerrequest_delete", controller.adminController.prayerrequest_delete);
  router.get("/prayerrequest_view/:id", controller.adminController.prayerrequest_view);


  router.get("/dailybread_listing", controller.adminController.dailybread_listing);
  router.get("/dailybread_add", controller.adminController.dailybread_add);
  router.post("/dailybread_create", controller.adminController.dailybread_create);
  router.post("/dailybread_delete", controller.adminController.dailybread_delete);
  router.get("/dailybread_view/:id", controller.adminController.dailybread_view);


  router.get("/groupfilter_listing", controller.adminController.groupfilter_listing);
  router.get("/groupfilter_add", controller.adminController.groupfilter_add);
  router.post("/groupfilter_create", controller.adminController.groupfilter_create);
  router.post("/groupfilter_delete", controller.adminController.groupfilter_delete);
  


  router.get("/businessfilter_listing", controller.adminController.businessfilter_listing);
  router.get("/businessfilter_add", controller.adminController.businessfilter_add);
  router.post("/businessfilter_create", controller.adminController.businessfilter_create);
  router.post("/businessfilter_delete", controller.adminController.businessfilter_delete);
  
  router.post("/test", controller.adminController.test);

  return router;
};

