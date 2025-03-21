const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;
const Models = require("../models/index");
const commonHelper = require("../helpers/commonHelper.js");
const resp = require("../config/responses");
const Sequelize = require("sequelize");

module.exports = {
  authentication: async (req, res, next) => {
    let token = req.headers["authorization"];
    console.log("token========>",token)
    if(token){
      token = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
      if (token) {
        jwt.verify(token, secretKey, async (err, authData) => {
          if (err) {
            return commonHelper.failed(res, resp.failed_msg.invTok);
          }
          let userDetail = await Models.userModel.findOne({
            where: { id: authData.id },
            raw: true,
          });
          req.user = userDetail;
          req.token = token;
          next();
        });
      } else {
        return commonHelper.error(res,resp.error_msg.tokenNotPrv);
      }
    }else{
      return commonHelper.error(res,resp.error_msg.tokenNotPrv);
    }
 
  },

  forgotPasswordVerify: async (req, res, next) => {
    try {
      const { token } = req.query;
      if (!token) {
        return commonHelper.failed(resp.failed_msg.tokReq);
      }
      const user = await Models.userModel.findOne({
        where: {
          resetToken: token,
          resetTokenExpires: { [Sequelize.Op.gt]: new Date() },
        },
        raw: true,
      });
      
      if (!user||user==null) {
        return res.render("sessionExpire", {message:resp.error_msg.pwdResTokExp, token:token});
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Forgot password token verification error:", error);
      return res.render("sessionExpire", {message:resp.error_msg.pwdResTokExp});
    }
  },
};
