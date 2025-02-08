var express = require('express');
var router = express.Router();
const controller = require('../controllers/index');
const {authentication,forgotPasswordVerify} = require('../middlewares/authentication');


module.exports=function(){
    // router.post('/login', controller.adminController.login);
    // router.post('/logout', authentication, controller.adminController.logout);

    return router
}

