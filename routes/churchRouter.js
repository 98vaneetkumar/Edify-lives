var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');


module.exports=function(){
    router.post('/signUp', controller.churchController.signUp);

    router.post('/logoUploadChurch', authentication, controller.churchController.logoUploadChurch);

    router.get("/cms",authentication, controller.userController.cms)
    router.get("/notificationsList",authentication, controller.userController.notificationsList)
    router.get("/filters_listing", controller.churchController.filters_listing)
    router.get("/bannerList",authentication, controller.churchController.bannerList)

    return router
}

