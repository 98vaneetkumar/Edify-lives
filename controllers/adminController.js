"use strict";

const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = process.env.SECRET_KEY;
const { Op } = require("sequelize");
const moment = require("moment");

const commonHelper = require("../helpers/commonHelper.js");
const helper = require("../helpers/validation.js");
const Models = require("../models/index");
const Response = require("../config/responses.js");

module.exports = {
  login_page: async (req, res) => {
    if (req.session.user) return res.redirect("/dashboard");
    res.render("Admin/login_page", { layout: false, msg: req.flash("msg") });
  },

  login: async (req, res) => {
    try {
      console.log("=====>", req.body);
      const { email, password } = req.body;
      const login_data = await Models.userModel.findOne({
        where: { email: email },
      });

      if (!login_data || !bcrypt.compareSync(password, login_data.password)) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/login");
      }

      if (login_data.role !== 0) {
        req.flash("error", "Please enter valid credentials");
        return res.redirect("/login");
      }

      req.session.user = login_data;
      req.flash("msg", "You are logged in successfully");
    } catch (error) {
      console.error("Login Error:", error);
      res.redirect("/login");
    }
  },

  dashboard: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/login");

      res.render("Admin/dashboard", {
        title: "Dashboard",
        session: req.session.user,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  },
};
