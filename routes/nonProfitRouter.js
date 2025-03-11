var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');


module.exports=function(){
    router.get("/getAllChurches",controller.nonProfileController.getAllChurches)

    router.post('/signUp', controller.nonProfileController.signUp);
    router.post("/uploadLogNonProfile",authentication, controller.nonProfileController.uploadLogNonProfile)
    router.get("/cms",authentication, controller.userController.cms)
    router.get("/notificationsList",authentication, controller.userController.notificationsList)
    return router
}

