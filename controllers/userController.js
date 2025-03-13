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

Models.needPostModel.belongsTo(Models.userModel, {
  foreignKey: 'userId',
  as: 'user'
});
Models.commentNeedPostModel.belongsTo(Models.userModel, {
  foreignKey: 'userId',
});
Models.likeNeedPostModel.belongsTo(Models.userModel, {
  foreignKey: 'userId',
});
Models.videoModel.belongsTo(Models.userModel, {
  foreignKey: 'userId',
})
Models.commentVideoModel.belongsTo(Models.userModel, {
  foreignKey: 'userId',
})

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
        deviceToken:Joi.string().optional(), // static data, will come from frontend
        deviceType: Joi.number().valid(1, 2).optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);

      const { email, password, devideToken, deviceType } = payload;

      const user = await Models.userModel.findOne({
        where: { email: email},
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
  needPost:async(req,res)=>{
    try {
      const schema = Joi.object().keys({
        title: Joi.string().required(),
        city:Joi.string().optional(),
        zipCode:Joi.string().optional()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        title:payload.title,
        city:payload.city,
        zipCode:payload.zipCode
      }
     let response= await Models.needPostModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.needPost,response);
    } catch (error) {
      throw error
    }
  },
  needPostList:async(req,res)=>{
    try {
     let limit= parseInt(req.query.limit, 10) || 10;
     let offset=parseInt(req.query.skip, 10) || 0;
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
      let response=await Models.needPostModel.findAll({
        attributes: {
          include: [
            [Sequelize.literal("(SELECT count(id) FROM commentNeedPost where needPostId=needPost.id )"), "commentsCount"],
            [Sequelize.literal("(SELECT count(id) FROM likeNeedPost where needPostId=needPost.id )"), "likesCount"],
            [Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentNeedPost where needPostId=needPost.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
            `),"isComment"],
            [Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM likeNeedPost where needPostId=needPost.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
            `),"isLike"]
          ]
        },
       include:[{
          model:Models.userModel,
          as:'user',
       }],
       where:where,
       limit: limit,
       offset: offset
      });
      return commonHelper.success(res, Response.success_msg.needPostList,response);
    } catch (error) {
      throw error
    }
  },
  commentOnNeedPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        needPostId:Joi.string().required(),
        comment:Joi.string().required()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        needPostId:payload.needPostId,
        comment:payload.comment
      }
      let response=await Models.commentNeedPostModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.needPostComment,response);
    } catch (error) {
      throw error
    }
  },
  commentOnNeedPostList:async(req,res)=>{
    try {
      let response=await Models.commentNeedPostModel.findAll({
        where:{
          needPostId:req.query.needPostId
        },
        include:[{
          model:Models.userModel,
        }]
      });
      return commonHelper.success(res, Response.success_msg.needPostCommentList,response);
    } catch (error) {
      throw error
    }
  },
  likeUnlikeNeedPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        needPostId:Joi.string().required()
      }); 
      let payload = await helper.validationJoi(req.body, schema);
     let has =  await Models.likeNeedPostModel.findOne({where: {
        userId:req.user.id,
        needPostId:payload.needPostId
      }})
      if(!has) {
        await Models.likeNeedPostModel.create({
          userId:req.user.id,
          needPostId:payload.needPostId
        });
        let response =  await Models.likeNeedPostModel.findOne({where: {
          userId:req.user.id,
          needPostId:payload.needPostId
        }})
        return commonHelper.success(res, Response.success_msg.likeNeedPost,response);
      }else{
        await Models.likeNeedPostModel.destroy({
          where:{
            userId:req.user.id,
            needPostId:payload.needPostId
          }
        });
        return commonHelper.success(res, Response.success_msg.unLikeNeedPost);

      }

    } catch (error) {
      throw error
    }
  },
  likeNeedPostList:async(req,res)=>{
    try {
      let response=await Models.likeNeedPostModel.findAll({
        where:{
          needPostId:req.query.needPostId
        },
        include:[{
          model:Models.userModel
        }]
      });
      return commonHelper.success(res, Response.success_msg.likeNeedPostList,response);
    } catch (error) {
      throw error
    }
  },




  testimonyPost:async(req,res)=>{
    try {
      const schema = Joi.object().keys({
        growingUp: Joi.string().optional(),
        beforeJesus:Joi.string().optional(),
        findJesus:Joi.string().optional(),
        faithInJesus:Joi.string().optional()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        growingUp:payload.growingUp,
        beforeJesus:payload.beforeJesus,
        findJesus:payload.findJesus,
        faithInJesus:payload.faithInJesus
      }
     let response= await Models.testimonyPostModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.testimonyPost,response);
    } catch (error) {
      throw error
    }
  },
  testimonyPostList:async(req,res)=>{
    try {
      let response=await Models.testimonyPostModel.findAll({
        attributes: {
          include: [
            [Sequelize.literal("(SELECT count(id) FROM commentTestimonyPost where testimonyPostId=testimonyPost.id )"), "commentsCount"],
            [Sequelize.literal("(SELECT count(id) FROM liketesTimonyPost where testimonyPostId=testimonyPost.id )"), "likesCount"],
            [Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentTestimonyPost where testimonyPostId=testimonyPost.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),"isComment"],
            [Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM liketesTimonyPost where testimonyPostId=testimonyPost.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),"isLike"]  
          ]
        },
       include:[{
          model:Models.userModel,
          as:'user',
       }]
      });
      return commonHelper.success(res, Response.success_msg.testimonyPostList,response);
    } catch (error) {
      throw error
    }
  },
  commentOnTestimonyPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        testimonyPostId:Joi.string().required(),
        comment:Joi.string().required()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        testimonyPostId:payload.testimonyPostId,
        comment:payload.comment
      }
      let response=await Models.commentTestimonyModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.testimonyPostComment,response);
    } catch (error) {
      throw error
    }
  },
  commentOnTestimonyPostList:async(req,res)=>{
    try {
      let response=await Models.commentTestimonyModel.findAll({
        where:{
          testimonyPostId:req.query.testimonyPostId
        },
        include:[{
          model:Models.userModel,
        }]
      });
      return commonHelper.success(res, Response.success_msg.testimonyPostCommentList,response);
    } catch (error) {
      throw error
    }
  },
  likeUnlikeTestimonyPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        testimonyPostId:Joi.string().required()
      }); 
      let payload = await helper.validationJoi(req.body, schema);
      let has=await Models.likeTestimonyModel.findOne({
        where:{
          userId:req.user.id,
          testimonyPostId:payload.testimonyPostId
        }
      })
      if(!has){
        let response=await Models.likeTestimonyModel.create({
          userId:req.user.id,
          testimonyPostId:payload.testimonyPostId
        });
        return commonHelper.success(res, Response.success_msg.likeTestimonyPost,response);
      }else{
        await Models.likeTestimonyModel.destroy({
          where:{
            userId:req.user.id,
            testimonyPostId:payload.testimonyPostId
          }
        });
        return commonHelper.success(res, Response.success_msg.unLikeTestimonyPost);
      }
   
    } catch (error) {
      throw error
    }
  },
  likeTestimonyPostList:async(req,res)=>{
    try {
      let response=await Models.likeTestimonyModel.findAll({
        where:{
          testimonyPostId:req.query.testimonyPostId
        },
        include:[{
          model:Models.userModel
        }]
      });
      return commonHelper.success(res, Response.success_msg.likeTestimonyPostList,response);
    } catch (error) {
      throw error
    }
  },
  addVideo:async(req,res)=>{
    try {
       let videoPath = null;
            if (req.files?.companyLogo) {
              videoPath = await commonHelper.fileUpload(
                req.files.video,
                "images"
              );
            }
            let thumbnailPath = null;
            if (req.files?.valueStatement) {
              valuesStatementPath = await commonHelper.fileUpload(
                req.files.thumbnail,
                "images"
              );
            }
          let objToSave={
            userId:req.user.id,
            caption:req.body.caption,
            video:videoPath,
            thumbnail:thumbnailPath,
          }
         let response= await Models.videoModel.create(objToSave);
         return commonHelper.success(res, Response.success_msg.addVideo,response);
    } catch (error) {
      throw error
    }
  },
  videoList:async(req,res)=>{
    try {
      let response=await Models.videoModel.findAll({
        attributes: {
          include: [
            [Sequelize.literal("(SELECT count(id) FROM commentVideo where videoId=videoModel.id )"), "commentsCount"],
            [Sequelize.literal("(SELECT count(id) FROM likeVideo where videoId=videoModel.id )"), "likesCount"],
            [Sequelize.literal(`
              (CASE 
                WHEN (SELECT count(id) FROM commentVideo where videoId=videoModel.id and userId = '${req.user.id}') > 0 
                THEN 1 
                ELSE 0 
              END)
              `),"isComment"],
            [Sequelize.literal(`
                (CASE 
                  WHEN (SELECT count(id) FROM likeVideo where videoId=videoModel.id and userId = '${req.user.id}') > 0 
                  THEN 1 
                  ELSE 0 
                END)
              `),"isLike"]  
          ]
        },
       include:[{
          model:Models.userModel,
          as:'user',
       }]
      });
      return commonHelper.success(res, Response.success_msg.videoList,response);
    } catch (error) {
      throw error
    }
  },
  likeUnlikeVideo:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        videoId:Joi.string().required()
      }); 
      let payload = await helper.validationJoi(req.body, schema);
     let has =  await Models.likeVideoModel.findOne({where: {
        userId:req.user.id,
        videoId:payload.videoId
      }})
      if(!has) {
        await Models.likeVideoModel.create({
          userId:req.user.id,
          videoId:payload.videoId
        });
        let response =  await Models.likeVideoModel.findOne({where: {
          userId:req.user.id,
          videoId:payload.videoId
        }})
        return commonHelper.success(res, Response.success_msg.likeVideo,response);
      }else{
        await Models.likeVideoModel.destroy({
          where:{
            userId:req.user.id,
            videoId:payload.videoId
          }
        });
        return commonHelper.success(res, Response.success_msg.unLikeVideo);

      }

    } catch (error) {
      throw error
    }
  },
  commentOnVideo:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        videoId:Joi.string().required(),
        comment:Joi.string().required()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        videoId:payload.videoId,
        comment:payload.comment
      }
      let response=await Models.commentVideoModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.commentVideo,response);
    } catch (error) {
      throw error
    }
  },
  commentOnVideoList:async(req,res)=>{
    try {
      let response=await Models.commentVideoModel.findAll({
        where:{
          videoId:req.query.videoId
        },
        include:[{
          model:Models.userModel,
        }]
      });
      return commonHelper.success(res, Response.success_msg.commentVideoList,response);
    } catch (error) {
      throw error
    }
  },
  createEvent:async(req,res)=>{
    try {
      const schema = Joi.object().keys({
        eventType: Joi.string().required(),
        address: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        date: Joi.string().optional(),
        time: Joi.string().optional(),
        eventTitle: Joi.string().optional(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        email: Joi.string().optional(),
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        eventType:payload.eventType,
        address:payload.address,
        latitude:payload.latitude,
        longitude:payload.longitude,
        date:payload.date,
        time:payload.time,
        eventTitle:payload.eventTitle,
        countryCode:payload.countryCode,
        phoneNumber:payload.phoneNumber,
        email:payload.email
      }
      let response=await Models.eventModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.createEvent,response);
    } catch (error) {
      throw error
    }
  },
  eventList:async(req,res)=>{
    try {
      let response=await Models.eventModel.findAll()
      return commonHelper.success(res, Response.success_msg.eventList,response);
    } catch (error) {
      throw error
    }
  },
};
