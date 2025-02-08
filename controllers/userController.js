"use strict";

const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const otpManager = require("node-twillo-otp-manager")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_SERVICE_SID
);
const secretKey = process.env.SECRET_KEY;

const commonHelper = require("../helpers/commonHelper.js");
const helper = require("../helpers/validation.js");
const Models = require("../models/index");
const Response = require("../config/responses.js");

module.exports = {
  signUp: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().required(),
        password: Joi.string().required(),
        role: Joi.number().valid(0, 1, 2, 3, 4).optional(),
        location: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        donateEdifyLivers: Joi.string().optional(),
        traitAndExperience: Joi.string().optional(),
        postEmpSeekingSection: Joi.number().optional(),
        hartOfService:Joi.number().optional(),  
        deviceToken: Joi.string().optional(),
        deviceType: Joi.number().valid(1, 2).optional(),
      });

      let payload = await helper.validationJoi(req.body, schema);

      const hashedPassword = await commonHelper.bcryptData(
        payload.password,
        process.env.SALT
      );

 
      let objToSave = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        password: hashedPassword,
        role: payload.role,
        location: payload.location,
        latitude: payload.latitude,
        longitude: payload.longitude,
        donateEdifyLivers: payload.donateEdifyLivers,
        traitAndExperience: payload.traitAndExperience,
        postEmpSeekingSection: payload.postEmpSeekingSection,
        hartOfService:payload.hartOfService,
        deviceToken: payload.deviceToken,
        deviceType: payload.deviceType,
      };

      let response = await Models.userModel.create(objToSave);

      return commonHelper.success(
        res,
        Response.success_msg.registered,
        response
      );
    } catch (error) {
      console.error("Error during sign up:", error);
      return commonHelper.error(res, Response.error_msg.regUser, error.message);
    }
  },

  login: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        deviceToken: "abc", // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, devideToken, deviceType } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email },
        raw: true,
      });

      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.userNotFound);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return commonHelper.failed(res, Response.failed_msg.invalidPassword);
      }

      await Models.userModel.update(
        {
          deviceToken: payload.deviceToken,
          deviceType: payload.deviceType,
          verifyStatus: 0,
        },
        {
          where: {
            id: user.id,
          },
        }
      );

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
        },
        secretKey
      );
      user.token = token;
      return commonHelper.success(res, Response.success_msg.login, user);
    } catch (err) {
      console.error("Error during login:", err);
      return commonHelper.error(res, Response.error_msg.loguser, err.message);
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      const { email } = payload;
      const user = await Models.userModel.findOne({
        where: { email: email },
      });
      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.noAccWEmail);
      }
      const resetToken = await commonHelper.randomStringGenerate(req, res);
      await user.update({
        resetTokenExpires: new Date(Date.now() + 3600000), // 1 hour
      });
     let otp =Math.floor(1000 + Math.random() * 9000).toString();
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        user,
        otp
      );
      await transporter.sendMail(emailTamplate);
      return commonHelper.success(res, Response.success_msg.passwordLink);
    } catch (error) {
      console.error("Forgot password error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.forgPwdErr,
        error.message
      );
    }
  },
  
  logout: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        deviceToken: Joi.string().required(),
        // devideToken: 'abc',
        devideType: Joi.string().optional(),
      });

      let payload = await helper.validationJoi(req.body, schema);

      let logoutDetail = { deviceToken: payload.deviceToken };

      await Models.userModel.update(logoutDetail, {
        where: { id: req.user.id },
      });

      return commonHelper.success(res, Response.success_msg.logout);
    } catch (error) {
      console.error("Logout error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.logoutErr,
        error.message
      );
    }
  },
  updateProfile: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        email: Joi.string().optional().email(),
        phoneNumber: Joi.string().optional(),
      });

      let payload = await helper.validationJoi(req.body, schema);

      if (!req.user || !req.user.id) {
        return commonHelper.failed(res, Response.failed_msg.userIdReq);
      }

      let updateProfile = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
      };

      await Models.userModel.update(updateProfile, {
        where: { id: req.user.id },
      });

      let response = await Models.userModel.findOne({
        where: { id: req.user.id },
        raw: true,
      });

      return commonHelper.success(
        res,
        Response.success_msg.updateProfile,
        response
      );
    } catch (error) {
      console.error("Error while updating profile", error);
      return commonHelper.error(
        res,
        Response.error_msg.updPrfErr,
        error.message
      );
    }
  },
  changePassword: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { currentPassword, newPassword } = payload;

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        req.user.password
      );

      if (!isPasswordValid) {
        return commonHelper.failed(res, Response.failed_msg.incorrectCurrPwd);
      }

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT
      );

      await Models.userModel.update(
        { password: hashedNewPassword },
        { where: { id: req.user.id } }
      );

      return commonHelper.success(res, Response.success_msg.passwordUpdate);
    } catch (error) {
      console.error("Error while changing password", error);
      return commonHelper.error(
        res,
        Response.error_msg.chngPwdErr,
        error.message
      );
    }
  },
  otpVerify: async (req, res) => {
    try {
      const { phone } = req.body; //"+911010101010"; // Replace with dynamic input
      const OTP = "YOUR OTP"; // Replace with dynamic input
      const otpResponse = await otpManager.verifyOTP(phone, OTP);
      console.log("OTP verify status:", otpResponse);

      if (otpResponse.status === "approved") {
        await Models.userModel.update(
          { otpVerify: 1 },
          { where: { id: req.user.id } }
        );
        return commonHelper.success(res, Response.success_msg.otpVerify);
      } else {
        throw new Error("OTP verification failed");
      }
    } catch (error) {
      console.error("Error while verifying the OTP:", error);
      return commonHelper.error(
        res,
        Response.error_msg.otpVerErr,
        error.message
      );
    }
  },
  resendOtp: async (req, res) => {
    try {
      const { phone } = req.body; //"+911010101010"; // Replace with dynamic input
      const userExist = await Models.userModel.findOne({
        where: {
          phoneNumber: req.body.phone,
        },
      });

      if (userExist) {
        const otpResponse = await otpManager.sendOTP(phone);
        console.log("OTP send status:", otpResponse);

        return commonHelper.success(
          res,
          Response.success_msg.otpSend,
          otpResponse
        );
      } else {
        console.log("User not found");

        return commonHelper.failed(res, Response.failed_msg.userNotFound);
      }
    } catch (error) {
      console.error("Error while resending the OTP:", error);
      return commonHelper.error(
        res,
        Response.error_msg.otpResErr,
        error.message
      );
    }
  },
};
