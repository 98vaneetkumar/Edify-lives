var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');


module.exports=function(){
    router.post('/signUp', controller.businessController.signUp);

    router.get("/cms",authentication, controller.userController.cms)
    router.get("/notificationsList",authentication, controller.userController.notificationsList)

    return router
}

