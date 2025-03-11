var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');


module.exports=function(){
    router.post('/signUp', controller.churchController.signUp);
    router.post('/login', controller.churchController.login);
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

    router.get("/bannerList",authentication, controller.churchController.bannerList)


    router.post("/needPost",authentication, controller.churchController.needPost)
    router.get("/needPostList",authentication, controller.churchController.needPostList)

    router.post("/commentOnNeedPost",authentication, controller.churchController.commentOnNeedPost)
    router.get("/commentOnNeedPostList",authentication, controller.churchController.commentOnNeedPostList)

    router.post("/likeNeedPost",authentication, controller.churchController.likeNeedPost)
    router.get("/likeNeedPostList",authentication, controller.churchController.likeNeedPostList)
    router.post("/unLikeNeedPost",authentication, controller.churchController.unlikeNeedPost)

    router.post("/testimonyPost",authentication, controller.churchController.testimonyPost)
    router.get("/testimonyPostList",authentication, controller.churchController.testimonyPostList)

    router.post("/commentOnTestimonyPost",authentication, controller.churchController.commentOnTestimonyPost)
    router.get("/commentOnTestimonyPostList",authentication, controller.churchController.commentOnTestimonyPostList)

    router.post("/likeTestimonyPost",authentication, controller.churchController.likeTestimonyPost)
    router.get("/likeTestimonyPostList",authentication, controller.churchController.likeTestimonyPostList)
    router.post("/unLikeTestimonyPost",authentication, controller.churchController.unlikeTestimonyPost)


    return router
}

