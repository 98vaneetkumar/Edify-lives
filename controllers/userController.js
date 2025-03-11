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
Models.notificationModel.belongsTo(Models.userModel, {
  foreignKey: "senderId",
  as: "sender",
});

module.exports = {
  signUp: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        countryCode: Joi.string().optional(),
        gender: Joi.string().optional(),
        phoneNumber: Joi.string().required(),
        password: Joi.string().required(),
        maritalStatus: Joi.number().valid(0, 1).optional(),
        profilePicture: Joi.any().optional(),
        location: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        donateEdifyLivers: Joi.string().optional(),
        traitAndExperience: Joi.string().optional(),
        postEmpSeekingSection: Joi.number().optional(),
        hartOfService: Joi.string().optional(),
        deviceToken: Joi.string().optional(),
        deviceType: Joi.number().valid(1, 2).optional(),
      });

      let payload = await helper.validationJoi(req.body, schema);

      // Check if email already exists
      let checkEmailAlreadyExists = await Models.userModel.findOne({
        where: { email: payload.email },
      });
      if (checkEmailAlreadyExists) {
        return commonHelper.failed(res, Response.failed_msg.emailAlreadyExists);
      }

      // Check if phone number already exists
      let checkPhoneNumberAlreadyExists = await Models.userModel.findOne({
        where: {
          countryCode: payload.countryCode,
          phoneNumber: payload.phoneNumber,
        },
      });
      if (checkPhoneNumberAlreadyExists) {
        return commonHelper.failed(
          res,
          Response.failed_msg.phoneNumberAlreadyExists
        );
      }

      // Hash password
      const hashedPassword = await commonHelper.bcryptData(
        payload.password,
        process.env.SALT
      );

      // Handle profile picture upload
      let profilePicturePath = null;
      if (req.files?.profilePicture) {
        profilePicturePath = await commonHelper.fileUpload(
          req.files.profilePicture,
          "images"
        );
      }

      // Ensure countryCode is properly formatted
      let countryCode = payload.countryCode
        ? payload.countryCode.replace(/\s+/g, "")
        : "";
      let phone = countryCode + payload.phoneNumber;

      // Validate phone number format (allow numbers with optional + sign)
      if (!/^\+?\d+$/.test(phone)) {
        return commonHelper.failed(res, Response.error_msg.invalidPhoneNumber);
      }

      // Object to save
      let objToSave = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        countryCode,
        phoneNumber: payload.phoneNumber,
        password: hashedPassword,
        role: 1,
        maritalStatus: payload.maritalStatus || null,
        gender: payload.gender || null,
        profilePicture: profilePicturePath || null,
        location: payload.location || null,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        donateEdifyLivers: payload.donateEdifyLivers || null,
        traitAndExperience: payload.traitAndExperience || null,
        postEmpSeekingSection: payload.postEmpSeekingSection || null,
        hartOfService: payload.hartOfService || null,
        deviceToken: payload.deviceToken || null,
        deviceType: payload.deviceType || null,
      };
      try {
        // let phone = countryCode + payload.phoneNumber;
        // const otpResponse = await otpManager.sendOTP(phone);
        // Save user
        await Models.userModel.create(objToSave);
        return commonHelper.success(res, Response.success_msg.otpResend);
      } catch (error) {
        return commonHelper.error(
          res,
          Response.error_msg.otpResErr,
          error.message
        );
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      return commonHelper.error(res, Response.error_msg.regUser, error.message);
    }
  },

  login: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        email: Joi.string().email().required(),
        role:Joi.number().required(),
        password: Joi.string().required(),
        deviceToken: "abc", // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, devideToken, deviceType } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email, role: payload.role },
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
      await Models.userModel.update(
        {
          resetToken: resetToken,
          resetTokenExpires: new Date(Date.now() + 3600000), // 1 hour
        },
        {
          where: {
            email: email,
          },
        }
      );
      const resetUrl = `${req.protocol}://${await commonHelper.getHost(
        req,
        res
      )}/users/resetPassword?token=${resetToken}`; // Add your URL
      let subject = "Reset Password";
      let emailLink = "forgotPassword";
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        req,
        user,
        resetUrl,
        subject,
        emailLink
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
  resendForgotPasswordLink: async (req, res) => {
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
      await Models.userModel.update(
        {
          resetToken: resetToken,
          resetTokenExpires: new Date(Date.now() + 3600000), // 1 hour
        },
        {
          where: {
            email: email,
          },
        }
      );
      const resetUrl = `${req.protocol}://${await commonHelper.getHost(
        req,
        res
      )}/users/resetPassword?token=${resetToken}`; // Add your URL
      let subject = "Reset Password";
      const transporter = await commonHelper.nodeMailer();
      const emailTamplate = await commonHelper.forgetPasswordLinkHTML(
        req,
        user,
        resetUrl,
        subject
      );
      // await transporter.sendMail(emailTamplate);
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
  resetPassword: async (req, res) => {
    try {
      let data = req.user;
      res.render("changePassword", { data: data });
    } catch (error) {
      console.error("Reset password error:", error);
      return commonHelper.error(
        res,
        Response.error_msg.resetPwdErr,
        error.message
      );
    }
  },
  forgotChangePassword: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        id: Joi.string().required(),
        newPassword: Joi.string().required(),
        confirmPassword: Joi.string().required(),
      });

      let payload = await helper.validationJoi(req.body, schema);
      //Destructing the data
      const { id, newPassword, confirmPassword } = payload;

      if (newPassword !== confirmPassword) {
        return commonHelper.failed(res, Response.failed_msg.pwdNoMatch);
      }

      const user = await Models.userModel.findOne({
        where: { id: id },
        raw: true,
      });
      if (!user) {
        return commonHelper.failed(res, Response.failed_msg.userNotFound);
      }

      const hashedNewPassword = await commonHelper.bcryptData(
        newPassword,
        process.env.SALT
      );

      await Models.userModel.update(
        {
          password: hashedNewPassword,
          resetToken: null,
          resetTokenExpires: null,
        },
        { where: { id: id } }
      );

      return res.render("successPassword", {
        message: Response.success_msg.passwordChange,
      });
    } catch (error) {
      console.error("Error while changing the password", error);
      return commonHelper.error(
        res,
        Response.error_msg.chngPwdErr,
        error.message
      );
    }
  },
  logout: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        deviceToken: Joi.string().required(),
        devideType: Joi.string().optional(),
      });

      let payload = await helper.validationJoi(req.body, schema);

      let logoutDetail = { deviceToken: null };

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
      if (req.body.otp == "1111") {
        await Models.userModel.update(
          { otpVerify: 1 },
          {
            where: {
              countryCode: req.body.countryCode,
              phoneNumber: req.body.phoneNumber,
            },
          }
        );
        let user = await Models.userModel.findOne({
          where: {
            countryCode: req.body.countryCode,
            phoneNumber: req.body.phoneNumber,
          },
          raw: true,
        });
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          secretKey
        );
        user.token = token;
        return commonHelper.success(res, Response.success_msg.otpVerify, user);
      } else {
        return commonHelper.failed(res, Response.failed_msg.invalidOtp);
      }

      const { countryCode, phoneNumber } = req.body; //"+911010101010"; // Replace with dynamic input
      const OTP = "YOUR OTP"; // Replace with dynamic input
      let phone = countryCode + phoneNumber;
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
      const { countryCode, phoneNumber } = req.body; //"+911010101010"; // Replace with dynamic input
      const userExist = await Models.userModel.findOne({
        where: {
          countryCode: req.body.countryCode,
          phoneNumber: req.body.phoneNumber,
        },
      });

      if (userExist) {
        let phone = countryCode + phoneNumber; //
        // const otpResponse = await otpManager.sendOTP(phone);
        console.log("OTP send status:");
        await Models.userModel.update(
          { otpVerify: 0 },
          {
            where: {
              countryCode: req.body.countryCode,
              phoneNumber: req.body.phoneNumber,
            },
          }
        );
        return commonHelper.success(res, Response.success_msg.otpResend);
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
  cms: async (req, res) => {
    try {
      console.log("first", req.params);
      let response = await Models.cmsModel.find();
      return commonHelper.success(res, Response.success_msg.cms, response);
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  notificationsList: async (req, res) => {
    try {
      let response = await Models.notificationModel.findAll({
        where: {
          recevierId: req.user.id,
        },
        include: [
          {
            model: Models.userModel,
            as: "sender",
          },
        ],
      });
      return commonHelper.success(
        res,
        Response.success_msg.notificationList,
        response
      );
    } catch (error) {
      throw error;
    }
  },

  maritalstatus_listing: async (req, res) => {
    try {
      let maritalstatus_data = await Models.maritalStatusModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.json({
        success: true,
        title: "Marital Status",
        maritalstatus_data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
  
  profilepreference_listing: async (req, res) => {
    try {
      let profilepreference_data = await Models.profilePreferenceModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.json({
        success: true,
        title: "Profile Preference",
        profilepreference_data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
  
  hearttoserve_listing: async (req, res) => {
    try {
      let hearttoserve_data = await Models.heartToServeModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.json({
        success: true,
        title: "Heart To Serve",
        hearttoserve_data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
  
  numberofmembers_listing: async (req, res) => {
    try {
      let numberofmembers_data = await Models.numberOfMembersModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.json({
        success: true,
        title: "Number of Members",
        numberofmembers_data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
  
  traitsexperience_listing: async (req, res) => {
    try {
      let traitsexperience_data = await Models.traitsExperienceModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.json({
        success: true,
        title: "Traits & Experience",
        traitsexperience_data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  



};
