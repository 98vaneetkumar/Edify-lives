"use strict";

const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const otpManager = require("node-twillo-otp-manager")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_SERVICE_SID
);
const secretKey = process.env.SECRET_KEY;
const stripe = require("stripe")(process.env.STRIPE_SK_KEY);
const commonHelper = require("../helpers/commonHelper.js");
const helper = require("../helpers/validation.js");
const Models = require("../models/index");
const Response = require("../config/responses.js");
let projection = [
  "id",
  "firstName",
  "lastName",
  "email",
  "countryCode",
  "phoneNumber",
  "role",
  "maritalStatus",
  "profilePicture",
];
Models.notificationModel.belongsTo(Models.userModel, {
  foreignKey: "senderId",
  as: "sender",
});

Models.needPostModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
  as: "user",
});
Models.commentNeedPostModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.likeNeedPostModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.videoModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.commentVideoModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.groupModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.commentGroupModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.groupModel.hasMany(Models.groupMemberModel, { foreignKey: "groupId" });
Models.likeGroupModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.groupPostModel.belongsTo(Models.groupModel, { foreignKey: "groupId" });
Models.groupMemberModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.groupMemberModel.belongsTo(Models.groupModel, { foreignKey: "groupId" });
Models.testimonyPostModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.addFeedModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.likeFeedModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.commentFeedModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.likeDailyBreadModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.dailyBreadCommentModel.belongsTo(Models.userModel, {
  foreignKey: "commentBy",
});
Models.prayerRequestCommentModel.belongsTo(Models.userModel, {
  foreignKey: "commentBy",
});
Models.likePrayerRequestModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
});
Models.groupPostModel.belongsTo(Models.userModel, {
  foreignKey: "userId",
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
        maritalStatus: Joi.string().optional(),
        profilePicture: Joi.any().optional(),
        location: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        donateEdifyLivers: Joi.string().optional(),
        traitAndExperience: Joi.string().optional(),
        postEmpSeekingSection: Joi.string().optional(),
        hartOfService: Joi.string().optional(),
        churchAccessCode: Joi.string().optional(),
        aboutMe:Joi.string().optional(),
        deviceToken: Joi.string().optional(),
        churchName:Joi.string().optional(),
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
      const customer = await stripe.customers.create({
        description: "Edify",
        email: req.body.email,
      });
      let customerId = customer.id;

      // Object to save
      let objToSave = {
        customerId:customerId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        countryCode,
        phoneNumber: payload.phoneNumber,
        password: hashedPassword,
        role: 1,
        aboutMe:payload.aboutMe,
        churchName:payload.churchName,
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
        churchAccessCode: payload.churchAccessCode || null,
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
        password: Joi.string().required(),
        deviceToken: Joi.string().optional(), // static data, will come from frontend
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
      let customerId;
      if(user&&user.customerId==null){
        const customer = await stripe.customers.create({
          description: "Edify",
          email: req.body.email,
        });
         customerId = customer.id;
      }
      await Models.userModel.update(
        {
          deviceToken: payload.deviceToken,
          deviceType: payload.deviceType,
          verifyStatus: 0,
          customerId: user&&user.customerId?user.customerId:customerId
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
        deviceToken: Joi.string().optional(),
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

  getProfile: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: { id: req.user.id },
        attributes:{
          include:[
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE  followingId = '${req.user.id}')`
              ),
              "followerCount ",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = '${req.user.id}')`
              ),
              "followingCount",
            ],

          ]
        },
        raw: true,
      });
      return commonHelper.success(
        res,
        Response.success_msg.getProfileData,
        response
      );
    } catch (error) {
      console.error("Error while fetching user own profile", error);
      return commonHelper.error(res, Response.error_msg.getPrf, error.message);
    }
  },
  otherUserProfile: async (req, res) => {
    try {
      let response = await Models.userModel.findOne({
        where: { id: req.query.userId },
        attributes:{
          include:[
              // Check if the logged-in user follows this user  ifollow -- following
              [
                Sequelize.literal(
                  `(SELECT COUNT(id) FROM follow WHERE followerId = '${req.query.userId}' AND followingId = users.id)`
                ),
                "iFollow",
              ],
  
              // Check if this user follows the logged-in user  heFollowsMe -- flower
              [
                Sequelize.literal(
                  `(SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.query.userId}')`
                ),
                "heFollowsMe",
              ],
               // Determine follow status
            [
              Sequelize.literal(`
              (CASE
                WHEN (SELECT COUNT(id) FROM follow WHERE followerId = '${req.query.userId}' AND followingId = users.id) > 0 
                AND (SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.query.userId}') > 0 
                THEN 'Mutual'
                
                WHEN (SELECT COUNT(id) FROM follow WHERE followerId = '${req.query.userId}' AND followingId = users.id) > 0 
                THEN 'I Follow'
                
                WHEN (SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.query.userId}') > 0 
                THEN 'He Follows Me'
                
                ELSE 'None'
              END)
            `),
              "followStatus",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE  followingId = '${req.query.userId}')`
              ),
              "followerCount ",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = '${req.query.userId}')`
              ),
              "followingCount",
            ],

          ]
        },
        raw: true,
      });
      return commonHelper.success(
        res,
        Response.success_msg.getProfileData,
        response
      );
    } catch (error) {
      console.error("Error while fetching user own profile", error);
      return commonHelper.error(res, Response.error_msg.getPrf, error.message);
    }
  },

  updateProfile: async (req, res) => {
    try {
      let fileImage = "";

      if (req.files && req.files.profilePicture) {
        fileImage = await helper.fileUpload(req.files.profilePicture, "images");
      } else {
        let user = await Models.userModel.findOne({
          where: { id: req.params.id },
        });

        fileImage = user.profilePicture;
      }

      // Update user profile
      await Models.userModel.update(
        {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          profilePicture: fileImage,
          email: req.body.email,
          countryCode: req.body.countryCode,
          gender: req.body.gender,
          aboutMe:req.body.aboutMe,
          phoneNumber: req.body.phoneNumber,
          maritalStatus: req.body.maritalStatus,
          location: req.body.location,
          latitude: req.body.latitude,
          longitude: req.body.longitude,
          donateEdifyLivers: req.body.donateEdifyLivers,
          traitAndExperience: req.body.traitAndExperience,
          postEmpSeekingSection: req.body.postEmpSeekingSection,
          hartOfService: req.body.hartOfService,
          churchAccessCode: req.body.churchAccessCode,
          usersAccessCode: req.body.usersAccessCode,
          churchName: req.body.churchName,
          churchWebsite: req.body.churchWebsite,
          churchCode: req.body.churchCode,
          numberOfMembers: req.body.numberOfMembers,
          visionStatement: req.body.visionStatement,
          valuesStatement: req.body.valuesStatement,
          typeOfBusiness: req.body.typeOfBusiness,
          businessAddress: req.body.businessAddress,
          businessUserAddress: req.body.businessUserAddress,
          addressNonProfit: req.body.addressNonProfit,
          webSiteNonProfile: req.body.webSiteNonProfile,
          nonProfitServe: req.body.nonProfitServe,
          nonPorfitOrganization: req.body.nonPorfitOrganization,
          chruchAttendAddress: req.body.chruchAttendAddress,
        },
        { where: { id: req.params.id } }
      );

      // Fetch updated user
      let updatedUser = await Models.userModel.findOne({
        where: { id: req.params.id },
      });

      return commonHelper.success(res, Response.success_msg.updProfile,updatedUser);
    } catch (error) {
      console.error("Error while updating user profile", error);
      return commonHelper.error(res, Response.error_msg.updPrf, error.message);
    }
  },

  cms: async (req, res) => {
    try {
      console.log("first", req.params);
      let response = await Models.cmsModel.find();
      return commonHelper.success(res, Response.success_msg.cms, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
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
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
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
  bannerList: async (req, res) => {
    try {
      let response = await Models.bannerModel.findAll();
      return commonHelper.success(res, Response.success_msg.needPost, response);
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  },
  businessType: async (req, res) => {
    try {
      let response = await Models.businessTypeModel.findAll();
      return commonHelper.success(res, Response.success_msg.needPost, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  eventType: async (req, res) => {
    try {
      let response = await Models.eventTypeModel.findAll();
      return commonHelper.success(res, Response.success_msg.needPost, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  needPost: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        title: Joi.string().required(),
        city: Joi.string().optional(),
        zipCode: Joi.string().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        title: payload.title,
        city: payload.city,
        zipCode: payload.zipCode,
      };
      let response = await Models.needPostModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.needPost, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  needPostList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where;
      if (req.query && req.query.city) {
        where = {
          [Op.or]: {
            city: {
              [Op.like]: "%" + req.query.city + "%",
            },
          },
        };
      }
      if (req.query && req.query.zipCode) {
        where = {
          [Op.or]: {
            zipCode: {
              [Op.like]: "%" + req.query.zipCode + "%",
            },
          },
        };
      }
      if (req.query && req.query.search) {
        where = {
          [Op.or]: {
            title: {
              [Op.like]: "%" + req.query.search + "%",
            },
          },
        };
      }
      let response = await Models.needPostModel.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM commentNeedPost where needPostId=needPost.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeNeedPost where needPostId=needPost.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentNeedPost where needPostId=needPost.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
            `),
              "isComment",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM likeNeedPost where needPostId=needPost.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
            `),
              "isLike",
            ],
          ],
        },
        include: [
          {
            model: Models.userModel,
            as: "user",
          },
        ],
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.needPostList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnNeedPost: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        needPostId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        needPostId: payload.needPostId,
        comment: payload.comment,
      };
      let response = await Models.commentNeedPostModel.create(objToSave);
      let needPost = await Models.needPostModel.findOne({
        where: {
          id: payload.needPostId,
        },
      });
      let objToSaveNotification = {
        senderId: req.user.id,
        recevierId: needPost.userId,
        message: "Commented on your need post",
        type: 1,
      }

      await Models.notificationModel.create(objToSaveNotification);
      return commonHelper.success(
        res,
        Response.success_msg.needPostComment,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnNeedPostList: async (req, res) => {
    try {
      let response = await Models.commentNeedPostModel.findAll({
        where: {
          needPostId: req.query.needPostId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.needPostCommentList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeUnlikeNeedPost: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        needPostId: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let has = await Models.likeNeedPostModel.findOne({
        where: {
          userId: req.user.id,
          needPostId: payload.needPostId,
        },
      });
      if (!has) {
        await Models.likeNeedPostModel.create({
          userId: req.user.id,
          needPostId: payload.needPostId,
        });
        let response = await Models.likeNeedPostModel.findOne({
          where: {
            userId: req.user.id,
            needPostId: payload.needPostId,
          },
        });
        let needPost = await Models.needPostModel.findOne({
          where: {
            id: payload.needPostId,
          },
        });
        let objToSaveNotification = {
          senderId: req.user.id,
          recevierId: needPost.userId,
          message: "Liked your need post",
          type: 2,
        }
        await Models.notificationModel.create(objToSaveNotification);
        return commonHelper.success(
          res,
          Response.success_msg.likeNeedPost,
          response
        );
      } else {
        await Models.likeNeedPostModel.destroy({
          where: {
            userId: req.user.id,
            needPostId: payload.needPostId,
          },
        });
        return commonHelper.success(res, Response.success_msg.unLikeNeedPost);
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeNeedPostList: async (req, res) => {
    try {
      let response = await Models.likeNeedPostModel.findAll({
        where: {
          needPostId: req.query.needPostId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.likeNeedPostList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  testimonyPost: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        testimoryType: Joi.string().optional(),
        growingUp: Joi.string().optional(),
        beforeJesus: Joi.string().optional(),
        findJesus: Joi.string().optional(),
        faithInJesus: Joi.string().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        testimoryType: payload.testimoryType,
        growingUp: payload.growingUp,
        beforeJesus: payload.beforeJesus,
        findJesus: payload.findJesus,
        faithInJesus: payload.faithInJesus,
      };
      let response = await Models.testimonyPostModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.testimonyPost,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  testimonyPostList: async (req, res) => {
    try {
      console.log("req.query",req.query);
      
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [
            { growingUp: { [Op.like]: `%${req.query.search}%` } },
            { beforeJesus: { [Op.like]: `%${req.query.search}%` } },
            { findJesus: { [Op.like]: `%${req.query.search}%` } },
            { faithInJesus: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      if (req.query && req.query.filter) {
        let filters = Array.isArray(req.query.filter)
          ? req.query.filter
          : [req.query.filter];
      
        // Flatten and split all filters into individual words
        filters = filters
          .flatMap(filterString => filterString.split(' '))
          .map(item => item.trim())
          .filter(item => item.length > 0);
          
        where = {
          [Op.or]: filters.map((filter) => ({
            [Op.or]: [
              { growingUp: { [Op.like]: `%${filter.trim()}%` } },
              { beforeJesus: { [Op.like]: `%${filter.trim()}%` } },
              { findJesus: { [Op.like]: `%${filter.trim()}%` } },
              { faithInJesus: { [Op.like]: `%${filter.trim()}%` } },
              { testimoryType: { [Op.like]: `%${filter.trim()}%` } },
            ],
          })), 
        };
      }
      

      let response = await Models.testimonyPostModel.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM commentTestimonyPost where testimonyPostId=testimonyPost.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeTestimonyPost where testimonyPostId=testimonyPost.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentTestimonyPost where testimonyPostId=testimonyPost.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeTestimonyPost where testimonyPostId=testimonyPost.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
          ],
        },
        include: [
          {
            model: Models.userModel,
            as: "user",
          },
        ],
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.testimonyPostList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnTestimonyPost: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        testimonyPostId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        testimonyPostId: payload.testimonyPostId,
        comment: payload.comment,
      };
      let response = await Models.commentTestimonyModel.create(objToSave);
      let testimonyPost = await Models.testimonyPostModel.findOne({
        where: {
          id: payload.testimonyPostId,
        },
      });
      let objToSaveNotification = {
        senderId: req.user.id,
        recevierId: testimonyPost.userId,
        message: "comment on your testimony post",
        type: 3,
      }
      await Models.notificationModel.create(objToSaveNotification);
      return commonHelper.success(
        res,
        Response.success_msg.testimonyPostComment,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnTestimonyPostList: async (req, res) => {
    try {
      let response = await Models.commentTestimonyModel.findAll({
        where: {
          testimonyPostId: req.query.testimonyPostId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.testimonyPostCommentList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeUnlikeTestimonyPost: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        testimonyPostId: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let has = await Models.likeTestimonyModel.findOne({
        where: {
          userId: req.user.id,
          testimonyPostId: payload.testimonyPostId,
        },
      });
      if (!has) {
        let response = await Models.likeTestimonyModel.create({
          userId: req.user.id,
          testimonyPostId: payload.testimonyPostId,
        });
        let testimonyPost = await Models.testimonyPostModel.findOne({
          where: {
            id: payload.testimonyPostId,
          },
        });
        let objToSaveNotification = {
          senderId: req.user.id,
          recevierId: testimonyPost.userId,
          message: "Liked your testimony post",
          type: 4,
        }
        await Models.notificationModel.create(objToSaveNotification);
        return commonHelper.success(
          res,
          Response.success_msg.likeTestimonyPost,
          response
        );
      } else {
        await Models.likeTestimonyModel.destroy({
          where: {
            userId: req.user.id,
            testimonyPostId: payload.testimonyPostId,
          },
        });
        return commonHelper.success(
          res,
          Response.success_msg.unLikeTestimonyPost
        );
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeTestimonyPostList: async (req, res) => {
    try {
      let response = await Models.likeTestimonyModel.findAll({
        where: {
          testimonyPostId: req.query.testimonyPostId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.likeTestimonyPostList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  addVideo: async (req, res) => {
    try {
      let videoPath = null;
      if (req.files?.video) {
        videoPath = await commonHelper.fileUpload(req.files.video, "images");
      }
      let thumbnailPath = null;
      if (req.files?.thumbnail) {
        thumbnailPath = await commonHelper.fileUpload(
          req.files.thumbnail,
          "images"
        );
      }
      let objToSave = {
        userId: req.user.id,
        caption: req.body.caption,
        video: videoPath,
        thumbnail: thumbnailPath,
      };

      let response = await Models.videoModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.addVideo, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  videoList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10
      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [{ caption: { [Op.like]: `%${req.query.search}%` } }],
        };
      }
      let response = await Models.videoModel.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM commentVideo where videoId=videos.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeVideo where videoId=videos.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentVideo where videoId=videos.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeVideo where videoId=videos.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
          ],
        },
        include: [
          {
            model: Models.userModel,
            as: "user",
          },
        ],
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.videoList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeUnlikeVideo: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        videoId: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let has = await Models.likeVideoModel.findOne({
        where: {
          userId: req.user.id,
          videoId: payload.videoId,
        },
      });
      if (!has) {
        await Models.likeVideoModel.create({
          userId: req.user.id,
          videoId: payload.videoId,
        });
        let response = await Models.likeVideoModel.findOne({
          where: {
            userId: req.user.id,
            videoId: payload.videoId,
          },
        });
        let video = await Models.videoModel.findOne({
          where: {
            id: payload.videoId,
          },
          raw: true
        });
        console.log("=============", video)
        let objToSaveNotification = {
          senderId: req.user.id,
          recevierId: video.userId,
          message: "Liked your video",
          type: 5,
        }
        await Models.notificationModel.create(objToSaveNotification);
        return commonHelper.success(
          res,
          Response.success_msg.likeVideo,
          response
        );
      } else {
        await Models.likeVideoModel.destroy({
          where: {
            userId: req.user.id,
            videoId: payload.videoId,
          },
        });
        return commonHelper.success(res, Response.success_msg.unLikeVideo);
      }
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnVideo: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        videoId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        videoId: payload.videoId,
        comment: payload.comment,
      };
      let response = await Models.commentVideoModel.create(objToSave);
      let video = await Models.videoModel.findOne({
        where: {
          id: payload.videoId,
        },
      });
      let objToSaveNotification = {
        senderId: req.user.id,
        recevierId: video.userId,
        message: "Commented on your video",
        type: 6,
      }
      await Models.notificationModel.create(objToSaveNotification);
      return commonHelper.success(
        res,
        Response.success_msg.commentVideo,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnVideoList: async (req, res) => {
    try {
      let response = await Models.commentVideoModel.findAll({
        where: {
          videoId: req.query.videoId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.commentVideoList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  createEvent: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        eventType: Joi.string().required(),
        address: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        date: Joi.string().optional(),
        time: Joi.string().optional(),
        endTime: Joi.string().optional(),
        eventTitle: Joi.string().optional(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        email: Joi.string().optional(),
        link: Joi.string().optional(),
        comment: Joi.string().optional(),
        eventDescription: Joi.string().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        eventType: payload.eventType,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        date: payload.date,
        time: payload.time,
        endTime: payload.endTime,
        eventTitle: payload.eventTitle,
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        link: payload.link,
        eventDescription: payload.eventDescription,
      };
      let response = await Models.eventModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.createEvent,
        response
      );
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  eventList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [
            { eventTitle: { [Op.like]: `%${req.query.search}%` } },
            { eventDescription: { [Op.like]: `%${req.query.search}%` } },
            { comment: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      if (req.query && req.query.filter) {
        let filters = Array.isArray(req.query.filter)
          ? req.query.filter
          : [req.query.filter];
               // Flatten and split all filters into individual words
        filters = filters
        .flatMap(filterString => filterString.split(' '))
        .map(item => item.trim())
        .filter(item => item.length > 0);
        where = {
          [Op.or]: filters.map((filter) => ({
            [Op.or]: [{ eventType: { [Op.like]: `%${filter.trim()}%` } }],
          })),
        };
      }
      let response = await Models.eventModel.findAndCountAll({
        where:where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.eventList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  groupFilterType: async (req, res) => {
    try {
      let response = await Models.groupFilter.findAll();
      return commonHelper.success(
        res,
        Response.success_msg.groupFilterType,
        response
      );
    } catch (error) {
      console.log("groupFilterType", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  filters_listing: async (req, res) => {
    try {
      let filters_data = await Models.filterTestimoniesModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.json({
        success: true,
        title: "Filter Testimonies",
        filters_data,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
  // <-----------------------------Create group------------------------------------------>
  createGroup: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        groupName: Joi.string().optional(),
        groupDescription: Joi.string().optional(),
        groupType: Joi.string().optional(),
        // groupCategory:Joi.string().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let groupLogoPath = null;
      if (req.files?.groupLogo) {
        groupLogoPath = await commonHelper.fileUpload(
          req.files.groupLogo,
          "images"
        );
      }
      let objToSave = {
        userId: req.user.id,
        groupName: payload.groupName,
        groupDescription: payload.groupDescription,
        groupType: payload.groupType,
        groupLogo: groupLogoPath,
        // groupCategory:payload.groupCategory
      };
      let response = await Models.groupModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.createGroup,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  groupList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [
            { groupName: { [Op.like]: `%${req.query.search}%` } },
            { groupDescription: { [Op.like]: `%${req.query.search}%` } },
            { groupType: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      if (req.query && req.query.filter) {
        let filters = Array.isArray(req.query.filter)
          ? req.query.filter
          : [req.query.filter];
               // Flatten and split all filters into individual words
        filters = filters
        .flatMap(filterString => filterString.split(' '))
        .map(item => item.trim())
        .filter(item => item.length > 0);
        where = {
          [Op.or]: filters.map((filter) => ({
            [Op.or]: [{ groupType: { [Op.like]: `%${filter.trim()}%` } }],
          })),
        };
      }
      let response = await Models.groupModel.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM commentGroup where groupId=group.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeGroup where groupId=group.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentGroup where groupId=group.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeGroup where groupId=group.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM groupMember where groupId=group.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isJoin",
            ],
          ],
        },
        include: [
          {
            model: Models.userModel,
            as: "user",
          },
        ],
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.groupList,
        response
      );
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  groupPost: async (req, res) => {
    try {
      let imagePath = null;
      if (req.files?.image) {
        imagePath = await commonHelper.fileUpload(req.files.image, "images");
      }
      let objToSave = {
        userId: req.user.id,
        groupId: req.body.groupId,
        description: req.body.description,
        image: imagePath,
      };
      let response = await Models.groupPostModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.groupPost,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  groupPostList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10
      let response = await Models.groupPostModel.findAll({
        where: {
          groupId: req.query.groupId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(
                `(SELECT count(id) FROM commentGroup WHERE groupPostId = groupPost.id )`
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeGroup WHERE groupPostId = groupPost.id)"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM commentGroup WHERE groupPostId = groupPost.id AND userId = '${req.user.id} ') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeGroup WHERE groupPostId = groupPost.id AND userId = '${req.user.id} ') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
            [
              Sequelize.literal(`
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', users.id, 'firstName', users.firstName,'lastName',users.lastName, 'profilePicture', users.profilePicture)
                ) FROM likeGroup 
                JOIN users ON users.id = likeGroup.userId 
                WHERE likeGroup.groupPostId = groupPost.id 
                ORDER BY likeGroup.createdAt DESC 
                LIMIT 3
              )
            `),
              "recentLikes",
            ],
          ],
        },
        limit: limit,
        offset: offset,
      });

      return commonHelper.success(
        res,
        Response.success_msg.grpPostList,
        response
      );
    } catch (error) {
      console.log("groupPostList", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  commentOnGroupPost: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        groupId: Joi.string().required(),
        groupPostId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        groupId: payload.groupId,
        groupPostId: payload.groupPostId,
        comment: payload.comment,
      };
      let response1 = await Models.commentGroupModel.create(objToSave);
      let response = await Models.commentGroupModel.findOne({
        where: {
          id: response1.id,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      let groupPost = await Models.groupPostModel.findOne({
        where: {
          id: payload.groupPostId,
          },
      });
      let objToSaveNotification = {
        senderId: req.user.id,
        recevierId: groupPost.userId,
        message: "Commented on your group post",
        type: 7,
      }
      await Models.notificationModel.create(objToSaveNotification);

      return commonHelper.success(
        res,
        Response.success_msg.commentGroup,
        response
      );
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeUnlikeGroupPost: async (req, res) => {
    try {
      console.log("===", req.body)
      let schema = Joi.object().keys({
        groupId: Joi.string().required(),
        groupPostId: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let has = await Models.likeGroupModel.findOne({
        where: {
          userId: req.user.id,
          groupId: payload.groupId,
          groupPostId: payload.groupPostId,
        },
      });
      if (!has) {
        let response = await Models.likeGroupModel.create({
          userId: req.user.id,
          groupId: payload.groupId,
          groupPostId: payload.groupPostId,
        });
        let groupPost = await Models.groupPostModel.findOne({
          where: {
            id: payload.groupPostId,
          },
        });
        let objToSaveNotification = {
          senderId: req.user.id,
          recevierId: groupPost.userId,
          message: "Liked your group post",
          type: 8,
        }
        await Models.notificationModel.create(objToSaveNotification)
        return commonHelper.success(
          res,
          Response.success_msg.likeGroup,
          response
        );
      } else {
        await Models.likeGroupModel.destroy({
          where: {
            userId: req.user.id,
            groupId: payload.groupId,
            groupPostId: payload.groupPostId,
          },
        });
        return commonHelper.success(res, Response.success_msg.unLikeGroup);
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  listOfCommentOnGroupPost: async (req, res) => {
    try {
      let response = await Models.commentGroupModel.findAndCountAll({
        where: {
          groupPostId: req.query.groupPostId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.commentGroupList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  listOfLikeGroupUsersPost: async (req, res) => {
    try {
      let response = await Models.likeGroupModel.findAll({
        where: {
          groupPostId: req.query.groupPostId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.likeGroupList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  myGroupList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10
      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [
            { groupName: { [Op.like]: `%${req.query.search}%` } },
            { groupDescription: { [Op.like]: `%${req.query.search}%` } },
            { groupType: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      let response = await Models.groupModel.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM commentGroup where groupId=group.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeGroup where groupId=group.id )"
              ),
              "likesCount",
            ],
          ],
        },
        include: [
          {
            model: Models.groupMemberModel,
            where: { userId: req.user.id }, // Filter only where userId matches req.user.id
            required: true, // Ensures only groups where the user is a member are included
          },
        ],
        where: where,
        limit: limit,
        offset: offset,
      });
      return commonHelper.success(
        res,
        Response.success_msg.myGroupList,
        response
      );
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  groupDetail: async (req, res) => {
    try {
      let response = await Models.groupModel.findOne({
        where: {
          id: req.query.groupId,
        },
        include: [
          {
            model: Models.userModel,
          },
          {
            model: Models.groupPostModel,
          },
        ],
      });
      return commonHelper.success(
        res,
        Response.success_msg.groupList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  joinGroup: async (req, res) => {
    try {
      let objToSave = {
        groupId: req.body.groupId,
        userId: req.user.id,
      };
      let response = await Models.groupMemberModel.create(objToSave);
      return commonHelper.success(
        res,
        Response.success_msg.joinGroup,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  groupMemberList: async (req, res) => {
    try {
      let response = await Models.groupMemberModel.findAndCountAll({
        where: {
          groupId: req.query.groupId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.groupMemberList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  nonProfileUserList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10
      let where = {
        id: { [Op.ne]: req.user.id },
        role: 4,
      };

      if (req.query && req.query.search) {
        where = {
          ...where, // Preserve existing conditions
          [Op.or]: [
            { firstName: { [Op.like]: `%${req.query.search}%` } },
            { lastName: { [Op.like]: `%${req.query.search}%` } },
            { email: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      let response = await Models.userModel.findAndCountAll({
        where: where,
        limit: limit,
        offset: offset,
      });
      return commonHelper.success(
        res,
        Response.success_msg.nonProfileUserList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  // <-----------------------------Create feed------------------------------------------>
  addFeed: async (req, res) => {
    try {
      const schema = Joi.object().keys({
        description: Joi.string().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let imagePath = null;
      if (req.files?.image) {
        imagePath = await commonHelper.fileUpload(req.files.image, "images");
      }
      let objToSave = {
        description: payload.description,
        image: imagePath,
        userId: req.user.id,
      };
      let response = await Models.addFeedModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.addFeed, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  feedList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10;
      let offset = (parseInt(req.query.skip, 10) || 0) * limit;
      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [{ description: { [Op.like]: `%${req.query.search}%` } }],
        };
      }
      let response = await Models.addFeedModel.findAndCountAll({
        attributes: {
          include: [
            // Count of likes
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM likeFeed WHERE likeFeed.feedId = addFeed.id)`
              ),
              "likesCount",
            ],

            // Count of comments
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM commentFeed WHERE commentFeed.feedId = addFeed.id)`
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentFeed where feedId=addFeed.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeFeed where feedId=addFeed.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
            // 3 recently liked users (Subquery)
            [
              Sequelize.literal(`
              (SELECT JSON_ARRAYAGG(
                  JSON_OBJECT('id', users.id, 'firstName', users.firstName,'lastName',users.lastName, 'profilePicture', users.profilePicture)
                ) FROM likeFeed 
                JOIN users ON users.id = likeFeed.userId 
                WHERE likeFeed.feedId = addFeed.id 
                ORDER BY likeFeed.createdAt DESC 
                LIMIT 3
              )
            `),
              "recentLikes",
            ],
          ],
        },
        include: [
          {
            model: Models.userModel,
            attributes: projection,
          },
        ],
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(res, Response.success_msg.feedList, response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeUnlikeFeed: async (req, res) => {
    try {
      let objToSave = {
        userId: req.user.id,
        feedId: req.body.feedId,
      };
      let has = await Models.likeFeedModel.findOne({
        where: {
          userId: req.user.id,
          feedId: req.body.feedId,
        },
      });

      if (!has) {
        let response = await Models.likeFeedModel.create(objToSave);
        let feed = await Models.addFeedModel.findOne({
          where: {
            id: req.body.feedId,
          },
        });
        let objToSaveNotification = {
          senderId: req.user.id,
          recevierId: feed.userId,
          message: "Liked your feed",
          type: 9,
        }
        await Models.notificationModel.create(objToSaveNotification)
        return commonHelper.success(
          res,
          Response.success_msg.likeFeed,
          response
        );
      } else {
        let response = await Models.likeFeedModel.destroy({
          where: {
            userId: req.user.id,
            feedId: req.body.feedId,
          },
        });
        return commonHelper.success(
          res,
          Response.success_msg.unlikeFeed,
          response
        );
      }
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  likeFeedList: async (req, res) => {
    try {
      let response = await Models.likeFeedModel.findAndCountAll({
        where: {
          feedId: req.query.feedId,
        },
        include: [
          {
            model: Models.userModel,
            attributes: projection,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.likeFeedList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnFeed: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        feedId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        userId: req.user.id,
        feedId: payload.feedId,
        comment: payload.comment,
      };
      let response = await Models.commentFeedModel.create(objToSave);
      let details = await Models.commentFeedModel.findOne({
        where: {
          id: response.id,
        },
        include: [
          {
            model: Models.userModel,
            attributes: projection,
          },
        ],
      });
      let feed = await Models.addFeedModel.findOne({
        where: {
          id: payload.feedId,
        },
      });
      let objToSaveNotification = {
        senderId: req.user.id,
        recevierId: feed.userId,
        message: "Commented on your feed",
        type: 10,
      }
      await Models.notificationModel.create(objToSaveNotification)
      return commonHelper.success(
        res,
        Response.success_msg.commentOnFeed,
        details
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  commentOnFeedList: async (req, res) => {
    try {
      let response = await Models.commentFeedModel.findAndCountAll({
        where: {
          feedId: req.query.feedId,
        },
        include: [
          {
            model: Models.userModel,
            attributes: projection,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.commentOnFeedList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  followList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10;
      let offset = (parseInt(req.query.skip, 10) || 0) * limit;
      let where = {
        id: { [Op.ne]: req.user.id }, // Exclude self
      }; 
      if (req.query && req.query.search) {
        where = {
          ...where, // Preserve existing conditions
          [Op.or]: [
            { firstName: { [Op.like]: `%${req.query.search}%` } },
            { lastName: { [Op.like]: `%${req.query.search}%` } },
            { email: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      let followList = await Models.userModel.findAll({
        attributes: {
          include: [
            // Check if the logged-in user follows this user  ifollow -- following
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = '${req.user.id}' AND followingId = users.id)`
              ),
              "iFollow",
            ],

            // Check if this user follows the logged-in user  heFollowsMe -- flower
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.user.id}')`
              ),
              "heFollowsMe",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followingId = users.id)`
              ),
              "follow",
            ],
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = users.id)`
              ),
              "following",
            ],
                        
            // Determine follow status
            [
              Sequelize.literal(`
              (CASE
                WHEN (SELECT COUNT(id) FROM follow WHERE followerId = '${req.user.id}' AND followingId = users.id) > 0 
                AND (SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.user.id}') > 0 
                THEN 'Mutual'
                
                WHEN (SELECT COUNT(id) FROM follow WHERE followerId = '${req.user.id}' AND followingId = users.id) > 0 
                THEN 'I Follow'
                
                WHEN (SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.user.id}') > 0 
                THEN 'He Follows Me'
                
                ELSE 'None'
              END)
            `),
              "followStatus",
            ],
          ],
        },
        where: where,
        // limit,
        // offset,
        order: [["createdAt", "DESC"]],
      });
      let count = await Models.userModel.findAll({
        attributes: {
          include: [
            // Check if the logged-in user follows this user  ifollow -- following
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = '${req.user.id}' AND followingId = users.id)`
              ),
              "iFollow",
            ],
            // Check if this user follows the logged-in user  heFollowsMe -- flower
            [
              Sequelize.literal(
                `(SELECT COUNT(id) FROM follow WHERE followerId = users.id AND followingId = '${req.user.id}')`
              ),
              "heFollowsMe",
            ],
          ],
        },
        where: where,
      });
      //1 for following  2 for follwer none for all
     // 1 = following, 2 = follower, else both
      if (req.query.type == 1) {
        followList = followList.filter((e) => e.dataValues.iFollow == 1);
      } else if (req.query.type == 2) {
        followList = followList.filter((e) => e.dataValues.heFollowsMe == 1);
      }else{
        followList=followList
      }

      if(req.query.type==1){
        count=count.filter((e) => e.dataValues.iFollow == 1);
      }else if (req.query.type == 2){
        count=count.filter((e) => e.dataValues.heFollowsMe == 1);

      }else{
        count=count
      }

      let resp={
        count:count.length,
        followList:followList,
      }

      return commonHelper.success(
        res,
        Response.success_msg.getFollowList,
        resp
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  followUnfollwUser: async (req, res) => {
    try {
      const { followingId } = req.body; // The user to be followed
      const followerId = req.user.id; // The logged-in user
      let existingFollow = await Models.followingModel.findOne({
        where: { followerId, followingId },
      });
      if (existingFollow) {
        await Models.followingModel.destroy({
          where: { followerId, followingId },
        });

        return commonHelper.success(res, Response.success_msg.unfollowUser);
      } else {
        let response = await Models.followingModel.create({
          followerId,
          followingId,
        });
        let objToSaveNotification = {
          senderId: followerId,
          recevierId: followingId,
          message: `${req.user.firstName} ${req.user.lastName} Followed you`,
          type: 11,
        };        
        await Models.notificationModel.create(objToSaveNotification)
        return commonHelper.success(
          res,
          Response.success_msg.followUser,
          response
        );
      }
    } catch (error) {
      console.log("error", error);

      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  // <-----------------------------Daily bread------------------------------------------>

  dailyBreadList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [{ description: { [Op.like]: `%${req.query.search}%` } }],
        };
      }

      let response = await Models.dailyBreadModel.findOne({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM dailyBreadComments where dailyBreadId=dailyBread.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeDailyBread where dailyBreadId=dailyBread.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM dailyBreadComments where dailyBreadId=dailyBread.id and commentBy = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeDailyBread where dailyBreadId=dailyBread.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
          ],
        },
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.getDailyBreadList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  dailyBreadDetail: async (req, res) => {
    try {
      let response = await Models.dailyBreadModel.findOne({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM dailyBreadComments where dailyBreaddailyBread.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likeDailyBread where dailyBreadId=dailyBread.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE
                WHEN (SELECT count(id) FROM dailyBreadComments where dailyBreadId=dailyBread.id and userId = '${req.user.id}') > 0
                THEN 1
                ELSE 0
                END)
                `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                  (CASE
                  WHEN (SELECT count(id) FROM likeDailyBread where dailyBreadId=dailyB
                  read.id and userId = '${req.user.id}') > 0
                  THEN 1
                  ELSE 0
                  END)
                  `),
              "isLike",
            ],
          ],
        },
        where: {
          id: req.query.dailyBreadId,
        },
      });
      return commonHelper.success(
        res,
        Response.success_msg.getDailyBreadDetail,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  dailyBreadComment: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        dailyBreadId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        commentBy: req.user.id,
        dailyBreadId: payload.dailyBreadId,
        comment: payload.comment,
      };
      let response1 = await Models.dailyBreadCommentModel.create(objToSave);
      let response = await Models.dailyBreadCommentModel.findOne({
        where: {
          id: response1.id,
        },
        include: [
          {
            model:Models.userModel
          }
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.commentAdded,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  dailyBreadCommentList: async (req, res) => {
    try {
      let response = await Models.dailyBreadCommentModel.findAndCountAll({
        where: {
          dailyBreadId: req.query.dailyBreadId,
        },
        include: [
          {
            model:Models.userModel
          }
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.commentList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  dailyBreadLikeUnlike: async (req, res) => {
    try {
      let has = await Models.likeDailyBreadModel.findOne({
        where: {
          userId: req.user.id,
          dailyBreadId: req.params.dailyBreadId,
        },
      });
      if (!has) {
        let objToSave = {
          userId: req.user.id,
          dailyBreadId: req.params.dailyBreadId,
        };
        let response = await Models.likeDailyBreadModel.create(objToSave);
        return commonHelper.success(
          res,
          Response.success_msg.likeDailyBreadAdded,
          response
        );
      } else {
        let response = await Models.likeDailyBreadModel.destroy({
          where: {
            userId: req.user.id,
            dailyBreadId: req.params.dailyBreadId,
          },
        });
        return commonHelper.success(
          res,
          Response.success_msg.unlikeDailyBreadAdded,
          response
        );
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  dailyBreadLikeList: async (req, res) => {
    try {
      let response = await Models.likeDailyBreadModel.findAll({
        where: {
          dailyBreadId: req.query.dailyBreadId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
      });
      return commonHelper.success(
        res,
        Response.success_msg.likeDailyBreadAdded,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  // <-----------------------------Prayer Request------------------------------------------>

  prayerRequestList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [{ description: { [Op.like]: `%${req.query.search}%` } }],
        };
      }

      let response = await Models.prayerRequestModel.findAndCountAll({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM prayerRequestComments where prayerRequestId=prayerRequest.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likePrayerRequest where prayerRequestId=prayerRequest.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM prayerRequestComments where prayerRequestId=prayerRequest.id and commentBy = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likePrayerRequest where prayerRequestId=prayerRequest.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
          ],
        },
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.getDailyBreadList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  prayerRequestDetail: async (req, res) => {
    try {
      let response = await Models.prayerRequestModel.findOne({
        attributes: {
          include: [
            [
              Sequelize.literal(
                "(SELECT count(id) FROM prayerRequestComments where prayerRequestId=prayerRequest.id )"
              ),
              "commentsCount",
            ],
            [
              Sequelize.literal(
                "(SELECT count(id) FROM likePrayerRequest where prayerRequestId=prayerRequest.id )"
              ),
              "likesCount",
            ],
            [
              Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM prayerRequestComments where prayerRequestId=prayerRequest.id and commentBy = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),
              "isComment",
            ],
            [
              Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likePrayerRequest where prayerRequestId=prayerRequest.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),
              "isLike",
            ],
          ],
        },
        where: {
          id: req.query.prayerRequestId,
        },
      });
      return commonHelper.success(
        res,
        Response.success_msg.getDailyBreadDetail,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  prayerRequestComment: async (req, res) => {
    try {
      let schema = Joi.object().keys({
        prayerRequestId: Joi.string().required(),
        comment: Joi.string().required(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave = {
        commentBy: req.user.id,
        prayerRequestId: payload.prayerRequestId,
        comment: payload.comment,
      };
      let response = await Models.prayerRequestCommentModel.create(objToSave);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  prayerRequestCommentList: async (req, res) => {
    try {
      let response = await Models.prayerRequestCommentModel.findAll({
        where: {
          prayerRequestId: req.query.prayerRequestId,
        },
        include: [
          {
            model: Models.prayerRequestModel,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return commonHelper.success(
        res,
        Response.success_msg.commentList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  prayerRequestLikeUnlike: async (req, res) => {
    try {
      let has = await Models.likePrayerRequestModel.findOne({
        where: {
          userId: req.user.id,
          prayerRequestId: req.params.prayerRequestId,
        },
      });
      if (!has) {
        let objToSave = {
          userId: req.user.id,
          prayerRequestId: req.params.prayerRequestId,
        };
        let response = await Models.likePrayerRequestModel.create(objToSave);
        return commonHelper.success(
          res,
          Response.success_msg.likeDailyPrayerAdded,
          response
        );
      } else {
        let response = await Models.likePrayerRequestModel.destroy({
          where: {
            userId: req.user.id,
            prayerRequestId: req.params.prayerRequestId,
          },
        });
        return commonHelper.success(
          res,
          Response.success_msg.unlikeDailyPrayerAdded,
          response
        );
      }
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },
  prayerRequestLikeList: async (req, res) => {
    try {
      let response = await Models.likePrayerRequestModel.findAll({
        where: {
          prayerRequestId: req.query.prayerRequestId,
        },
        include: [
          {
            model: Models.userModel,
          },
        ],
      });
      return commonHelper.success(
        res,
        Response.success_msg.likeDailyPrayerList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  userTraitAndExperienceList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {};
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [
            { firstName: { [Op.like]: `%${req.query.search}%` } },
            { lastName: { [Op.like]: `%${req.query.search}%` } },
            { email: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      if (req.query && req.query.filter) {
        let filters = Array.isArray(req.query.filter)
          ? req.query.filter
          : [req.query.filter];
               // Flatten and split all filters into individual words
        filters = filters
        .flatMap(filterString => filterString.split(' '))
        .map(item => item.trim())
        .filter(item => item.length > 0);
        where = {
          [Op.or]: filters.map((filter) => ({
            [Op.or]: [{ traitAndExperience: { [Op.like]: `%${filter.trim()}%` } }],
          })),
        };
      }

      let response = await Models.userModel.findAndCountAll({
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

      return commonHelper.success(
        res,
        Response.success_msg.userTraitAndExpList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  userTypeOfBusinessList: async (req, res) => {
    try {
      let limit = parseInt(req.query.limit, 10) || 10; // Default limit is 10
      let offset = (parseInt(req.query.skip, 10) || 0) * limit; // Corrected the radix to 10

      let where = {
        role: 3,
      };
      if (req.query && req.query.search) {
        where = {
          [Op.or]: [
            { firstName: { [Op.like]: `%${req.query.search}%` } },
            { lastName: { [Op.like]: `%${req.query.search}%` } },
            { email: { [Op.like]: `%${req.query.search}%` } },
          ],
        };
      }
      if (req.query && req.query.filter) {
        let filters = Array.isArray(req.query.filter)
          ? req.query.filter
          : [req.query.filter];
               // Flatten and split all filters into individual words
        filters = filters
        .flatMap(filterString => filterString.split(' '))
        .map(item => item.trim())
        .filter(item => item.length > 0);
        where = {
          [Op.or]: filters.map((filter) => ({
            [Op.or]: [{ typeOfBusiness: { [Op.like]: `%${filter.trim()}%` } }],
          })),
        };
      }
      let response = await Models.userModel.findAndCountAll({
        where: where,
        limit: limit,
        offset: offset,
        order: [["createdAt", "DESC"]],
      });

      return commonHelper.success(
        res,
        Response.success_msg.userTypeOfBusList,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  getChristianCompanies: async(req, res)=>{
    try {
      let response = await Models.christianOwnedCompaniesModel.findAndCountAll({
        order: [["createdAt", "DESC"]],
      })
      return commonHelper.success(
        res,
        Response.success_msg.getChristianCompanies,
        response
      );
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  getChristiansSeekingEmp: async(req, res)=>{
    try {
      let response = await Models.christianSeekingEmpModel.findAndCountAll({
        order: [["createdAt", "DESC"]],
      })
      return commonHelper.success(res,Response.success_msg.getChristiansSeekingEmp,response);
    } catch (error) {
      console.log("error", error);
      return commonHelper.error(
        res,
        Response.error_msg.internalServerError,
        error.message
      );
    }
  },

  paymentIntent:async(req,res)=>{
    try {
      let userDetail = await Models.userModel.findOne({
        where: { id: req.user.id },
        raw: true,
      });
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: userDetail.customerId },
        { apiVersion: "2022-11-15" }
      );
      const amount = parseFloat((req.body.amount * 100).toFixed(2));

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "USD",
        customer: userDetail.customerId,
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
        automatic_payment_methods: {
          enabled: true,
        },
      });
      let result = {
        paymentIntent: paymentIntent,
        ephemeralKey: ephemeralKey.secret,
        customer: userDetail.customerId,
        publishableKey: process.env.STRIPE_PK_KEY,
        transactionId:paymentIntent.id
      };
      let adminId=await Models.userModel.findOne({
        where:{
          role:0
        },
        raw:true
      })
      let objToSave={
        senderId:req.user.id,
        receiverId:adminId.id,
        amount:req.body.amount,
        transactionId:paymentIntent.id
      }
      await Models.transactionModel.create(objToSave)
      return commonHelper.success(res,Response.success_msg.paymentIntent,result);

    } catch (error) {
      console.log("error",error);
      return commonHelper.error(res,Response.error_msg.internalServerError,error.message);
    }
  },
  webHookFrontEnd:async(req,res)=>{
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        req.body.transactionId
      );
       await Models.transactionModel.update(
        {
          payment_status:
            paymentIntent.status === "succeeded"
              ? "succeeded"
              : paymentIntent.status,
              
        },
        {
          where: {
            transactionId: req.body.transactionId,
          },
        }
      );
      return commonHelper.success(res,Response.success_msg.stripeWebHookFrontEnd);

    } catch (error) {
      console.log("error",error);
      return commonHelper.error(res,Response.error_msg.internalServerError,error.message);
    }
  },
  messageImageUpload:async(req,res)=>{
    try {
      let imagePath = null;
      if (req.files?.image) {
        imagePath = await commonHelper.fileUpload(
          req.files.image,
          "images"
        );
      }
      return commonHelper.success(res,Response.success_msg.messageImageUpload,imagePath);
    } catch (error) {
      console.log("error",error);
      return commonHelper.error(res,Response.error_msg.internalServerError,error.message);
    }
  },
  
};
