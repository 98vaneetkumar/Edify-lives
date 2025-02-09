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
    signUp:async(req,res)=>{
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
               numberOfMembers:Joi.number().optional(),
               visionStatement:Joi.string().optional(),
               valuesStatement:Joi.string().optional(),
               maritalStatus: Joi.number().valid(0,1).optional(),
               location: Joi.string().optional(),
               latitude: Joi.string().optional(),
               longitude: Joi.string().optional(),
               donateEdifyLivers: Joi.string().optional(),
               deviceToken: Joi.string().optional(),
               deviceType: Joi.number().valid(1, 2).optional(),
             });
       
             let payload = await helper.validationJoi(req.body, schema);
             let checkEmailAlreadyExists =await Models.userModel.findOne({
               where:{
                 email:payload.email
               }
             })
             if(checkEmailAlreadyExists){
               return commonHelper.failed(res, Response.failed_msg.emailAlreadyExists);
             }
             let checkPhoneNumberAlreadyExists =await Models.userModel.findOne({
               where:{
                 countryCode:payload.countryCode,
                 phoneNumber:payload.phoneNumber
               }
             })
             if(checkPhoneNumberAlreadyExists){
               return commonHelper.failed(res, Response.failed_msg.phoneNumberAlreadyExists);
             }
       
             const hashedPassword = await commonHelper.bcryptData(
               payload.password,
               process.env.SALT
             );
       
             let visionStatementPath = null;
             if (req.files && req.files.visionStatement) {
                visionStatementPath = await commonHelper.fileUpload(
                 req.files.visionStatement
               );
             }
             let valuesStatementPath = null;
             if (req.files && req.files.valueStatement) {
                valuesStatementPath = await commonHelper.fileUpload(
                 req.files.valueStatement
               );
             }
        
             let objToSave = {
               firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                role:2,
                countryCode: payload.countryCode,
                phoneNumber: payload.phoneNumber,
                password: hashedPassword,
                churchName: payload.churchName,
                churchWebsite: payload.churchWebsite,
                churchAccessCode: payload.churchAccessCode,
                numberOfMembers:payload.numberOfMembers,
                visionStatement:payload.visionStatementPath,
                valuesStatement:payload.valuesStatementPath,
                maritalStatus: payload.maritalStatus,
                location: payload.location,
                latitude: payload.latitude,
                longitude: payload.longitude,
                donateEdifyLivers: payload.donateEdifyLivers,
                deviceToken: payload.deviceToken,
                deviceType: payload.deviceType,

             };
             try {
               let phone=countryCode+phoneNumber; //
               // const otpResponse = await otpManager.sendOTP(phone);
             } catch (error) {
               return commonHelper.failed(
                 res,
                 Response.error_msg.invalidPhoneNumber,
               );
             }
             await Models.userModel.create(objToSave);
             return commonHelper.success(
               res,
               Response.success_msg.otpResend,
             );
           } catch (error) {
             console.error("Error during sign up:", error);
             return commonHelper.error(res, Response.error_msg.regUser, error.message);
           }
    }
}