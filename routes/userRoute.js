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
    router.get("/filters_listing", controller.userController.filters_listing)

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

    router.post("/createGroup",authentication, controller.userController.createGroup)
    router.get("/groupList",authentication, controller.userController.groupList)
    router.post("/commentOnGroup",authentication, controller.userController.commentOnGroup)
    router.post("/likeUnlikeGroup",authentication, controller.userController.likeUnlikeGroup)
    router.get("/listOfCommentOnGroup",authentication, controller.userController.listOfCommentOnGroup)
    router.get("/listOfLikeGroupUsers",authentication, controller.userController.listOfLikeGroupUsers)

    router.get("/myGroupList",authentication, controller.userController.myGroupList)
    router.get("/groupDetail",authentication, controller.userController.groupDetail)
    router.post("/joinGroup",authentication, controller.userController.joinGroup)
    router.get("/groupMemberList",authentication, controller.userController.groupMemberList)

    router.get("/nonProfileUserList",authentication, controller.userController.nonProfileUserList)

    router.post("/addFeed",authentication, controller.userController.addFeed)
    router.get("/feedList",authentication, controller.userController.feedList)
    router.post("/likeUnlikeFeed",authentication, controller.userController.likeUnlikeFeed)
    router.get("/likeFeedList",authentication, controller.userController.likeFeedList)
    router.post("/commentOnFeed",authentication, controller.userController.commentOnFeed)
    router.get("/commentOnFeedList",authentication, controller.userController.commentOnFeedList)

    router.get("/getFollowList ",authentication, controller.userController.getFollowList)
    router.post("/followUnfollwUser",authentication, controller.userController.followUnfollwUser)
    
    return router
}

