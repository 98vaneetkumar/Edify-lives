"use strict";

const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const moment = require("moment");
const Models = require("../models/index");

module.exports = {
  login_page: async (req, res) => {
    if (req.session.user) return res.redirect("/admin/dashboard");
    res.render("admin/login_page", { layout: false, msg: req.flash("msg") });
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const login_data = await Models.userModel.findOne({
        where: { email: email },
      });

      if (!login_data || !bcrypt.compareSync(password, login_data.password)) {
        req.flash("error", "Invalid email or password");
        return res.redirect("/admin/login");
      }

      if (login_data.role !== 0) {
        req.flash("error", "Please enter valid credentials");
        return res.redirect("/admin/login");
      }

      req.session.user = login_data;
      req.flash("msg", "You are logged in successfully");
      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      res.redirect("/admin/login");
    }
  },

  dashboard: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let user = await Models.userModel.count();
      const currentYear1 = moment().year();

      // Count sign-ups for each month
      const counts1 = [];
      const months1 = [];

      for (let month = 1; month <= 12; month++) {
        const startOfMonth1 = moment(
          `${currentYear1}-${month}-01`,
          "YYYY-MM-DD"
        )
          .startOf("month")
          .toDate();
        const endOfMonth1 = moment(startOfMonth1).endOf("month").toDate();

        const whereCondition = {
          createdAt: {
            [Op.between]: [startOfMonth1, endOfMonth1],
          },
          role: "1",
        };

        const month_data1 = moment(startOfMonth1).format("MMM, YYYY");

        // Count sign-ups for each month
        const userCount = await Models.userModel.count({
          where: whereCondition,
        });

        counts1.push(userCount);
        months1.push(month_data1);
      }

      res.render("dashboard", {
        title: "Dashboard",
        counts1: counts1,
        months1: months1,
        user,
        session: req.session.user,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  },

  aboutUs: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

      let about_data = await Models.cmsModel.findOne({
        where: { type: 1 },
      });

      // Use res.render instead of res.redirect to render the "about" page
      return res.render("admin/cms/about", {
        title: "About Us",
        about_data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  about_post: async (req, res) => {
    try {
      let about_data = await Models.cmsModel.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: { type: 1 },
        }
      );
      req.flash("msg", "About Us updated successfully");
      res.redirect("back");
    } catch (error) {
      console.log(error);
    }
  },

  privacyPolicy: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let policy_data = await Models.cmsModel.findOne({
        where: { type: 2 },
      });
      res.render("admin/cms/privacy", {
        title: "Privacy Policy",
        policy_data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  privacy_post: async (req, res) => {
    try {
      let data = await Models.cmsModel.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: { type: 2 },
        }
      );
      req.flash("msg", "Privacy Policy updated successfully");
      res.redirect("back");
    } catch (error) {
      console.log(error);
    }
  },

  termsConditions: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let terms_data = await Models.cmsModel.findOne({
        where: { type: 3 },
      });
      res.render("admin/cms/terms", {
        title: "Terms & Conditions",
        terms_data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
    }
  },

  termsConditionsPost: async (req, res) => {
    try {
      let data = await Models.cmsModel.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: { type: 3 },
        }
      );
      req.flash("msg", "Terms and Conditions updated successfully");
      res.redirect("back");
    } catch (error) {
      console.log(error);
    }
  },

  test: async (req, res) => {
    try {
      let objtosave = {
        title: "hello",
        description: "well well well",
        type: 3,
      };
      const saved = await Models.cmsModel.create(objtosave);
      console.log(saved);
    } catch (error) {
      throw error;
    }
  },
};
