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
        churchName: Joi.string().optional(),
        churchWebsite: Joi.string().optional(),
        churchAccessCode: Joi.string().optional(),
        numberOfMembers: Joi.number().optional(),
        valuesStatement: Joi.any().optional(),
        maritalStatus: Joi.number().valid(0, 1).optional(),
        location: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        donateEdifyLivers: Joi.string().optional(),
        deviceToken: Joi.string().optional(),
        deviceType: Joi.number().valid(1, 2).optional(),
        hartOfService: Joi.string().optional(),
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

      // Handle values statement upload
      let valuesStatementPath = null;
      if (req.files?.valueStatement) {
        valuesStatementPath = await commonHelper.fileUpload(
          req.files.valueStatement,
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
        role: 2,
        countryCode,
        phoneNumber: payload.phoneNumber,
        password: hashedPassword,
        churchName: payload.churchName || null,
        churchWebsite: payload.churchWebsite || null,
        churchAccessCode: payload.churchAccessCode || null,
        numberOfMembers: payload.numberOfMembers || null,
        valuesStatement: valuesStatementPath || null,
        maritalStatus: payload.maritalStatus || null,
        location: payload.location || null,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        donateEdifyLivers: payload.donateEdifyLivers || null,
        deviceToken: payload.deviceToken || null,
        deviceType: payload.deviceType || null,
        hartOfService:payload.hartOfService || null,
      };
       try {
        // const otpResponse = await otpManager.sendOTP(phone);
        await Models.userModel.create(objToSave);
        return commonHelper.success(res, Response.success_msg.otpResend);
       } catch (error) {
         return commonHelper.error(res, Response.error_msg.otpResErr, error.message);
       }

    } catch (error) {
      console.error("Error during sign-up:", error);
      return commonHelper.error(res, Response.error_msg.regUser, error.message);
    }
  },

  logoUploadChurch: async(req, res)=>{
    try {
      
      // Handle vision statement upload
      let visionStatementPath = null;
      if (req.files?.visionStatement) {
        visionStatementPath = await commonHelper.fileUpload(
          req.files.visionStatement,
          "images"
        );
      }

      let companyLogoPath = null;
      if (req.files?.companyLogo) {
        companyLogoPath = await commonHelper.fileUpload(
          req.files.companyLogo,
          "images"
        );
      }

      let objToUpdate = await Models.userModel.update({
        visionStatement: visionStatementPath || null,
        companyLogo: companyLogoPath || null,
      }, {where: {
        id: req.user.id
      }})

      let uploadLogo = await Models.userModel.findOne({where: {id: req.user.id}})
      return commonHelper.success(res, Response.success_msg.logoUploadSuccess,uploadLogo);

    } catch (error) {
      console.error("Error during sign-up:", error);
      return commonHelper.error(res, Response.error_msg.errUploadLogo, error.message);
    }
  },

  bannerList:async(req,res)=>{
    try {
      let response=await Models.bannerModel.findAll();
      return commonHelper.success(res, Response.success_msg.bannerList,response);
    } catch (error) {
      throw error
    }
  },





  needPost:async(req,res)=>{
    try {
      const schema = Joi.object().keys({
        title: Joi.string().required()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        title:payload.title
      }
     let response= await Models.needPostModel.create(objToSave);
      return commonHelper.success(res, Response.success_msg.needPost,response);
    } catch (error) {
      throw error
    }
  },
  needPostList:async(req,res)=>{
    try {
      let response=await Models.needPostModel.findAll({

       include:[{
          model:Models.userModel,
          as:'user',
       }]
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
  likeNeedPost:async(req,res)=>{
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
      }
      let response =  await Models.likeNeedPostModel.findOne({where: {
        userId:req.user.id,
        needPostId:payload.needPostId
      }})
      return commonHelper.success(res, Response.success_msg.likeNeedPost,response);
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
  unlikeNeedPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        needPostId:Joi.string().required()
      }); 
      let payload = await helper.validationJoi(req.body, schema);
      let response=await Models.likeNeedPostModel.destroy({
        where:{
          userId:req.user.id,
          needPostId:payload.needPostId
        }
      });
      return commonHelper.success(res, Response.success_msg.unLikeNeedPost);
    } catch (error) {
      throw error
    }
  },



  testimonyPost:async(req,res)=>{
    try {
      const schema = Joi.object().keys({
        title: Joi.string().required()
      });
      let payload = await helper.validationJoi(req.body, schema);
      let objToSave={
        userId:req.user.id,
        title:payload.title
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
  likeTestimonyPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        testimonyPostId:Joi.string().required()
      }); 
      let payload = await helper.validationJoi(req.body, schema);
      let response=await Models.likeTestimonyModel.create({
        userId:req.user.id,
        testimonyPostId:payload.testimonyPostId
      });
      return commonHelper.success(res, Response.success_msg.likeTestimonyPost,response);
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
  unlikeTestimonyPost:async(req,res)=>{
    try {
      let schema=Joi.object().keys({
        testimonyPostId:Joi.string().required()
      }); 
      let payload = await helper.validationJoi(req.body, schema);
      let response=await Models.likeTestimonyModel.destroy({
        where:{
          userId:req.user.id,
          testimonyPostId:payload.testimonyPostId
        }
      });
      return commonHelper.success(res, Response.success_msg.unLikeTestimonyPost);
    } catch (error) {
      throw error
    }
  },
};
