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
        email: Joi.string().email().required(),
        countryCode: Joi.string().optional(),
        phoneNumber: Joi.string().required(),
        password: Joi.string().required(),
        firstName: Joi.string().optional(),
        typeOfBusiness: Joi.string().optional(),
        businessAddress: Joi.string().optional(),
        businessUserAddress: Joi.string().optional(),
        profilePicture: Joi.any().optional(),
        maritalStatus: Joi.number().valid(0, 1).optional(),
        location: Joi.string().optional(),
        latitude: Joi.string().optional(),
        longitude: Joi.string().optional(),
        donateEdifyLivers: Joi.string().optional(),
        deviceToken: Joi.string().optional(),
        deviceType: Joi.number().valid(1, 2).optional(),
        hartOfService: Joi.string().optional(),
        aboutMe:Joi.string().optional(),
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
        where: { countryCode: payload.countryCode, phoneNumber: payload.phoneNumber },
      });
      if (checkPhoneNumberAlreadyExists) {
        return commonHelper.failed(res, Response.failed_msg.phoneNumberAlreadyExists);
      }
  
      // Hash password
      const hashedPassword = await commonHelper.bcryptData(payload.password, process.env.SALT);
  
      // Handle business logo upload
      let profilePicturePath = null;
      if (req.files?.profilePicture) {
        profilePicturePath = await commonHelper.fileUpload(req.files.profilePicture, 'images');
      }
  
      // Handle values statement upload
      let valuesStatementPath = null;
      if (req.files?.valueStatement) {
        valuesStatementPath = await commonHelper.fileUpload(req.files.valueStatement, 'images');
      }
  
      // Ensure countryCode is properly formatted
      let countryCode = payload.countryCode ? payload.countryCode.replace(/\s+/g, '') : '';
      let phone = countryCode + payload.phoneNumber;
  
      // Validate phone number format (allow numbers with optional + sign)
      if (!/^\+?\d+$/.test(phone)) {
        return commonHelper.failed(res, Response.error_msg.invalidPhoneNumber);
      }
  
      // Object to save
      let objToSave = {
        email: payload.email,
        role: 3,
        countryCode,
        phoneNumber: payload.phoneNumber,
        password: hashedPassword,
        aboutMe:payload.aboutMe,
        firstName: payload.firstName || null,
        typeOfBusiness: payload.typeOfBusiness || null,
        businessAddress: payload.businessAddress || null,
        businessUserAddress: payload.businessUserAddress || null,
        profilePicture: profilePicturePath || null,
        maritalStatus: payload.maritalStatus || null,
        location: payload.location || null,
        latitude: payload.latitude || null,
        longitude: payload.longitude || null,
        donateEdifyLivers: payload.donateEdifyLivers || null,
        deviceToken: payload.deviceToken || null,
        deviceType: payload.deviceType || null,
        hartOfService: payload.hartOfService || null,
      };
  

       try {
        // const otpResponse = await otpManager.sendOTP(phone);
            // Save user
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
  
}