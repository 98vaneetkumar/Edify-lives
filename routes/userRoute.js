var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');


module.exports=function(){
    router.get("/maritalstatus_listing", controller.userController.maritalstatus_listing);
    router.get("/profilepreference_listing", controller.userController.profilepreference_listing);
    router.get("/hearttoserve_listing", controller.userController.hearttoserve_listing);
    router.get("/numberofmembers_listing", controller.userController.numberofmembers_listing);
    router.get("/traitsexperience_listing", controller.userController.traitsexperience_listing);

    
    router.post('/signUp', controller.userController.signUp);
    router.post('/login', controller.userController.login);
    router.post('/logout', authentication, controller.userController.logout);
    router.post('/forgotPassword', controller.userController.forgotPassword);
    router.post('/resendForgotPasswordLink', controller.userController.resendForgotPasswordLink);
    router.get('/resetPassword', forgotPasswordVerify, controller.userController.resetPassword);
    router.post('/forgotChangePassword', controller.userController.forgotChangePassword);
    router.post('/changePassword', authentication, controller.userController.changePassword);
    router.post('/otpVerify', controller.userController.otpVerify);
    router.post('/resendOtp', controller.userController.resendOtp);

    router.get("/cms",authentication, controller.userController.cms)
    router.get("/notificationsList",authentication, controller.userController.notificationsList)


    
//  <------------------------------------Comman api's------------------------------------------------------------>

router.post("/needPost",authentication, controller.userController.needPost)
router.get("/needPostList",authentication, controller.userController.needPostList)

router.post("/commentOnNeedPost",authentication, controller.userController.commentOnNeedPost)
router.get("/commentOnNeedPostList",authentication, controller.userController.commentOnNeedPostList)

router.post("/likeUnlikeNeedPost",authentication, controller.userController.likeUnlikeNeedPost)
router.get("/likeNeedPostList",authentication, controller.userController.likeNeedPostList)

router.post("/testimonyPost",authentication, controller.userController.testimonyPost)
router.get("/testimonyPostList",authentication, controller.userController.testimonyPostList)

router.post("/commentOnTestimonyPost",authentication, controller.userController.commentOnTestimonyPost)
router.get("/commentOnTestimonyPostList",authentication, controller.userController.commentOnTestimonyPostList)

router.post("/likeUnlikeTestimonyPost",authentication, controller.userController.likeUnlikeTestimonyPost)
router.get("/likeTestimonyPostList",authentication, controller.userController.likeTestimonyPostList)

router.post("/addVideo",authentication, controller.userController.addVideo)
router.get("/videoList",authentication, controller.userController.videoList)
router.post("/likeUnlikeVideo",authentication, controller.userController.likeUnlikeVideo)

router.post("/commentOnVideo",authentication, controller.userController.commentOnVideo)
router.get("/commentOnVideoList",authentication, controller.userController.commentOnVideoList)

router.post("/createEvent",authentication, controller.userController.createEvent)
router.get("/eventList",authentication, controller.userController.eventList)
return router
}

