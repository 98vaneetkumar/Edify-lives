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
        addressNonProfit: Joi.string().required(),
        email: Joi.string().email().required(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().required(),
        password: Joi.string().required(),
        websiteNonProfit: Joi.string().optional(),
        nonProfitServe: Joi.string().optional(),
        nonProfitOrganization: Joi.string().optional(),
        churchAttendAddress: Joi.string().optional(),
        maritalStatus: Joi.number().valid(0, 1).optional(),
        location: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        donateEdifyLivers: Joi.string().optional(),
        deviceToken: Joi.string().optional(),
        deviceType: Joi.number().valid(1, 2).optional(),
        profilePicture: Joi.string().optional(),
        valuesStatement: Joi.string().optional(),
        aboutUs:Joi.string().optional(),
        webSiteNonProfile: Joi.string().optional(),
        chruchAttendAddress:Joi.string().optional()
      });

      let payload = await helper.validationJoi(req.body, schema);

      let checkEmailAlreadyExists = await Models.userModel.findOne({
        where: { email: payload.email },
      });
      if (checkEmailAlreadyExists) {
        return commonHelper.failed(res, Response.failed_msg.emailAlreadyExists);
      }

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

      const hashedPassword = await commonHelper.bcryptData(
        payload.password,
        process.env.SALT
      );

      let profilePicturePath = null;
      if (req.files && req.files.profilePicture) {
        profilePicturePath = await commonHelper.fileUpload(req.files.profilePicture);
      }

      let valuesStatementPath = null;
      if (req.files && req.files.valuesStatement) {
        valuesStatementPath = await commonHelper.fileUpload(
          req.files.valuesStatement
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
      let objToSave = {
        firstName: payload.firstName,
        addressNonProfit: payload.addressNonProfit,
        email: payload.email,
        role: 4,
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        aboutMe:payload.aboutMe,
        password: hashedPassword,
        websiteNonProfit: payload.websiteNonProfit,
        nonProfitServe: payload.nonProfitServe,
        nonProfitOrganization: payload.nonProfitOrganization,
        churchAttendAddress: payload.churchAttendAddress,
        maritalStatus: payload.maritalStatus,
        profilePicture: profilePicturePath,
        valuesStatement: valuesStatementPath,
        location: payload.location,
        latitude: payload.latitude,
        longitude: payload.longitude,
        donateEdifyLivers: payload.donateEdifyLivers,
        deviceToken: payload.deviceToken,
        deviceType: payload.deviceType,
        webSiteNonProfile: payload.webSiteNonProfile,
        chruchAttendAddress:payload.chruchAttendAddress
      };

    try {
           // const otpResponse = await otpManager.sendOTP(phone);
           await Models.userModel.create(objToSave);
           return commonHelper.success(res, Response.success_msg.otpResend);
          } catch (error) {
            console.log("error",error);
            
            return commonHelper.error(res, Response.error_msg.otpResErr, error.message);
          }
   
    } catch (error) {
      console.error("Error during sign up:", error);
      return commonHelper.error(res, Response.error_msg.regUser, error.message);
    }
  },
  uploadLogNonProfile:async(req,res)=>{
    try {
      let profilePicturePath = null;
      if (req.files && req.files.profilePicture) {
        profilePicturePath = await commonHelper.fileUpload(req.files.profilePicture);
      }

      let valuesStatementPath = null;
      if (req.files && req.files.valuesStatement) {
        valuesStatementPath = await commonHelper.fileUpload(
          req.files.valuesStatement
        );
      }
      
        await Models.userModel.update({
            profilePicture: profilePicturePath,
            valuesStatement: valuesStatementPath,
          }, {where: {
            id: req.user.id
          }})
      
        let uploadLogo = await Models.userModel.findOne({where: {id: req.user.id}})
        return commonHelper.success(res, Response.success_msg.logoUploadSuccess,uploadLogo);
    } catch (error) {
      throw error
    }
  },
  getAllChurches:async(req,res)=>{
    try {
      let response=await Models.userModel.findAll({
        where:{
          role:2
        }
      })
      return commonHelper.success(res, Response.success_msg.churchesFound, response);
    } catch (error) {
      throw error
    }
  }
};
