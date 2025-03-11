"use strict";

/* RENDER: when displaying views/templates with data (forms/errors/user-data) [URL stays same]
 REDIRECT: after successful actions to prevent resubmission (form-success/logout/cancel) [URL changes]*/

const bcrypt = require("bcrypt");
const { Op, fn, col } = require("sequelize");
const moment = require("moment");
const Models = require("../models/index");
const helper = require("../helpers/commonHelper");

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
        return res.json({
          success: false,
          message: "Invalid email or password",
        });
      }

      if (login_data.role !== 0) {
        return res.json({
          success: false,
          message: "Please enter valid credentials",
        });
      }

      req.session.user = login_data;
      req.flash("msg", "You are logged in successfully");

      return res.json({
        success: true,
        message: "You are logged in successfully",
      });
    } catch (error) {
      console.error("Login Error:", error);
      return res.redirect("/admin/login");
    }
  },

  logout: async (req, res) => {
    try {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  profile: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      res.render("admin/profile", {
        title: "Profile",
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  profile_update: async (req, res) => {
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
        },
        { where: { id: req.params.id } }
      );

      // Fetch updated user
      let updatedUser = await Models.userModel.findOne({
        where: { id: req.params.id },
      });
      if (updatedUser) {
        req.session.user = updatedUser;
      }

      req.flash("msg", "Profile updated successfully");
      res.redirect("/admin/dashboard");
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  change_password: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/login");
      res.render("admin/changePassword", {
        title: "Reset Password",
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  change_password_post: async (req, res) => {
    try {
      if (!req.session) {
        console.error("Session is not initialized!");
        return res.status(500).json({ error: "Session not initialized." });
      }

      const { password, new_password, confirm_new_password } = req.body;
      const userId = req.session.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({ error: "User not found. Please log in again." });
      }

      const user = await Models.userModel.findOne({ where: { id: userId } });

      if (!user) {
        return res
          .status(401)
          .json({ error: "User not found. Please log in again." });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        return res
          .status(400)
          .json({ error: "Your old password is incorrect." });
      }

      if (new_password !== confirm_new_password) {
        return res
          .status(400)
          .json({ error: "New password and confirm password do not match." });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      await Models.userModel.update(
        { password: hashedPassword },
        { where: { id: userId } }
      );

      // Destroy session and send a success response
      req.session.destroy();
      return res.json({
        success: true,
        message: "Your password has been updated successfully!",
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  dashboard: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

      const [
        user,
        churches,
        business,
        nonprofit,
        subscription,
        banner,
        heartToServe,
        numberOfMembers,
        maritalStatus,
        profilePreference,
        traitsExperience,
        filterCount,
      ] = await Promise.all([
        Models.userModel.count({ where: { role: 1 } }),
        Models.userModel.count({ where: { role: 2 } }),
        Models.userModel.count({ where: { role: 3 } }),
        Models.userModel.count({ where: { role: 4 } }),
        Models.subscriptionModel.count(),
        Models.bannerModel.count(),
        Models.heartToServeModel.count(),
        Models.numberOfMembersModel.count(),
        Models.maritalStatusModel.count(),
        Models.profilePreferenceModel.count(),
        Models.traitsExperienceModel.count(),
        Models.filterTestimoniesModel.count(),
      ]);

      const currentYear = Math.max(2025, moment().year());
      const months = [];
      const counts = { users: [], churches: [], business: [], nonprofit: [] };

      const startOfYear = moment(`${currentYear}-01-01`)
        .startOf("year")
        .toDate();
      const endOfYear = moment(startOfYear).endOf("year").toDate();

      const monthlyCounts = await Models.userModel.findAll({
        attributes: [
          [fn("MONTH", col("createdAt")), "month"],
          "role",
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          createdAt: { [Op.between]: [startOfYear, endOfYear] },
        },
        group: ["month", "role"],
        raw: true,
      });

      for (let month = 1; month <= 12; month++) {
        months.push(moment(`${currentYear}-${month}-01`).format("MMM, YYYY"));
        counts.users.push(0);
        counts.churches.push(0);
        counts.business.push(0);
        counts.nonprofit.push(0);
      }

      monthlyCounts.forEach(({ month, role, count }) => {
        if (role == 1) counts.users[month - 1] = parseInt(count);
        else if (role == 2) counts.churches[month - 1] = parseInt(count);
        else if (role == 3) counts.business[month - 1] = parseInt(count);
        else if (role == 4) counts.nonprofit[month - 1] = parseInt(count);
      });

      res.render("dashboard", {
        title: "Dashboard",
        counts1: counts,
        months1: months,
        user,
        churches,
        business,
        nonprofit,
        subscription,
        banner,
        heartToServe,
        numberOfMembers,
        maritalStatus,
        profilePreference,
        traitsExperience,
        filterCount,
        session: req.session.user,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      return res.redirect("/admin/login");
    }
  },

  getDashboardData: async (req, res) => {
    try {
      const year = parseInt(req.query.year) || moment().year();
      const chartType = req.query.chartType;

      // Ensure the requested year is within the valid range
      if (year < 2024) {
        return res.status(400).json({
          success: false,
          error: "Year must be 2024 or later",
        });
      }

      const startOfYear = moment(`${year}-01-01`).startOf("year").toDate();
      const endOfYear = moment(startOfYear).endOf("year").toDate();

      // Define role based on chart type
      let role;
      switch (chartType) {
        case "users":
          role = 1;
          break;
        case "churches":
          role = 2;
          break;
        case "business":
          role = 3;
          break;
        case "nonprofit":
          role = 4;
          break;
        default:
          role = null;
      }

      let query = {
        attributes: [
          [fn("MONTH", col("createdAt")), "month"],
          [fn("COUNT", col("id")), "count"],
        ],
        where: {
          createdAt: { [Op.between]: [startOfYear, endOfYear] },
        },
        group: ["month"],
        raw: true,
      };

      // Apply role filter if chartType is specified
      if (role) {
        query.where.role = role;
      }

      const monthlyCounts = await Models.userModel.findAll(query);

      // Initialize an array with 12 months set to zero
      const counts = new Array(12).fill(0);

      // Populate counts where data is available
      monthlyCounts.forEach(({ month, count }) => {
        counts[month - 1] = parseInt(count);
      });

      // Generate months labels
      const months = Array.from({ length: 12 }, (_, i) =>
        moment(`${year}-${i + 1}-01`).format("MMM")
      );

      res.json({
        success: true,
        counts: { [chartType]: counts },
        months,
      });
    } catch (error) {
      console.error("Dashboard Data Error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
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
      return res.redirect("/admin/login");
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
      return res.redirect("/admin/login");
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
      return res.redirect("/admin/login");
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
      return res.redirect("/admin/login");
    }
  },

  users_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let user_data = await Models.userModel.findAll({
        where: {
          role: 1,
        },
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/users/usersListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Users",
        user_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  user_view: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

      let userId = req.params.id;

      // Find user details
      let data = await Models.userModel.findOne({
        where: { id: userId },
      });
      res.render("admin/users/userView", {
        title: "Users",
        data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  user_status: async (req, res) => {
    try {
      const { id, status } = req.body;
      console.log(`Updating user ${id} to status: ${status}`); // Debugging

      if (!id || status === undefined) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid data provided" });
      }

      const [updatedRows] = await Models.userModel.update(
        { status },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found or status unchanged",
        });
      }

      res.json({
        success: true,
        message: "Status changed successfully",
        status,
      });
    } catch (error) {
      console.log("Error updating user status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      return res.redirect("/admin/login");
    }
  },

  user_delete: async (req, res) => {
    try {
      const userId = req.body.id;
      // Delete user
      await Models.userModel.destroy({ where: { id: userId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete user " });
      return res.redirect("/admin/login");
    }
  },

  churches_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let church_data = await Models.userModel.findAll({
        where: {
          role: 2,
        },
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/churches/churchListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Churches",
        church_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  church_view: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

      let churchId = req.params.id;

      // Find user details
      let data = await Models.userModel.findOne({
        where: { id: churchId },
      });
      res.render("admin/churches/churchView", {
        title: "Churches",
        data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  church_status: async (req, res) => {
    try {
      const { id, status } = req.body;

      const [updatedRows] = await Models.userModel.update(
        { status },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Church not found or status unchanged",
        });
      }

      res.json({
        success: true,
        message: "Status changed successfully",
        status,
      });
    } catch (error) {
      console.log("Error updating church status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      return res.redirect("/admin/login");
    }
  },

  church_delete: async (req, res) => {
    try {
      const churchId = req.body.id;
      await Models.userModel.destroy({ where: { id: churchId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete church " });
      return res.redirect("/admin/login");
    }
  },

  business_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let business_data = await Models.userModel.findAll({
        where: {
          role: 3,
        },
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/business/businessListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Business",
        business_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  business_view: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

      let businessId = req.params.id;

      // Find user details
      let data = await Models.userModel.findOne({
        where: { id: businessId },
      });
      res.render("admin/business/businessView", {
        title: "Business",
        data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  business_status: async (req, res) => {
    try {
      const { id, status } = req.body;

      const [updatedRows] = await Models.userModel.update(
        { status },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "business not found or status unchanged",
        });
      }

      res.json({
        success: true,
        message: "Status changed successfully",
        status,
      });
    } catch (error) {
      console.log("Error updating business status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      return res.redirect("/admin/login");
    }
  },

  business_delete: async (req, res) => {
    try {
      const businessId = req.body.id;
      await Models.userModel.destroy({ where: { id: businessId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete business " });
      return res.redirect("/admin/login");
    }
  },

  nonprofit_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let nonprofit_data = await Models.userModel.findAll({
        where: {
          role: 4,
        },
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/nonprofit/nonprofitListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Non-Profit",
        nonprofit_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },
  nonprofit_view: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

      let nonprofitId = req.params.id;

      // Find user details
      let data = await Models.userModel.findOne({
        where: { id: nonprofitId },
      });
      res.render("admin/nonprofit/nonprofitView", {
        title: "Non-Profit",
        data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  nonprofit_status: async (req, res) => {
    try {
      const { id, status } = req.body;

      const [updatedRows] = await Models.userModel.update(
        { status },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "nonprofit not found or status unchanged",
        });
      }

      res.json({
        success: true,
        message: "Status changed successfully",
        status,
      });
    } catch (error) {
      console.log("Error updating nonprofit status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      return res.redirect("/admin/login");
    }
  },

  nonprofit_delete: async (req, res) => {
    try {
      const nonprofitId = req.body.id;
      await Models.userModel.destroy({ where: { id: nonprofitId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete nonprofit " });
      return res.redirect("/admin/login");
    }
  },

  subscription_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let subscription_data = await Models.subscriptionModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/subscription/subscriptionListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "subscription",
        subscription_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  subscription_add: async (req, res) => {
    try {
      let title = "subscription";
      res.render("admin/subscription/subscriptionAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  subscription_create: async (req, res) => {
    try {
      const { type, description, period, amount } = req.body;
      let objToSave = {
        amount: amount,
        description: description,
        type: type,
        period: period,
      };
      await Models.subscriptionModel.create(objToSave);

      req.flash("msg", "Challenge added successfully.");
      return res.json({
        success: true,
        redirect: "/admin/subscription_listing",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  subscription_status: async (req, res) => {
    try {
      const { id, status } = req.body;

      const [updatedRows] = await Models.subscriptionModel.update(
        { status },
        { where: { id } }
      );

      if (updatedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "subscription not found or status unchanged",
        });
      }

      res.json({
        success: true,
        message: "Status changed successfully",
        status,
      });
    } catch (error) {
      console.log("Error updating subscription status:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
      return res.redirect("/admin/login");
    }
  },

  subscription_delete: async (req, res) => {
    try {
      const subscriptionId = req.body.id;
      await Models.subscriptionModel.destroy({ where: { id: subscriptionId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete subscription " });
      return res.redirect("/admin/login");
    }
  },

  subscription_edit: async (req, res) => {
    try {
      let title = "subscription";
      const { id } = req.params;
      const subscription = await Models.subscriptionModel.findOne({
        where: { id: id },
      });

      res.render("admin/subscription/subscriptionEdit", {
        subscription,
        title,
        session: req.session.user,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      req.flash("msg", "Error fetching subscription details.");
      res.redirect("/admin/subscriptionListing");
    }
  },

  subscription_update: async (req, res) => {
    try {
      const { id, description, type, period, amount } = req.body;

      await Models.subscriptionModel.update(
        { description, type, period, amount },
        { where: { id: id } }
      );

      return res.json({
        success: true,
        message: "Subscription updated successfully.",
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  banner_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let banner_data = await Models.bannerModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/banner/bannerListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "banner",
        banner_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  banner_add: async (req, res) => {
    try {
      let title = "banner";
      res.render("admin/banner/bannerAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  banner_create: async (req, res) => {
    try {
      let bannerImage = "";

      if (req.files && req.files.bannerImage) {
        bannerImage = await helper.fileUpload(req.files.bannerImage, "images");
      } else {
        return res.json({
          success: false,
          message: "Banner image is required.",
        });
      }

      let objToSave = {
        title: req.body.title,
        bannerImage: bannerImage,
      };

      await Models.bannerModel.create(objToSave);

      return res.json({ success: true, message: "Banner added successfully." });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  banner_delete: async (req, res) => {
    try {
      const bannerId = req.body.id;
      await Models.bannerModel.destroy({ where: { id: bannerId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete banner " });
      return res.redirect("/admin/login");
    }
  },

  banner_edit: async (req, res) => {
    try {
      let title = "banner";
      const { id } = req.params;
      const banner = await Models.bannerModel.findOne({
        where: { id: id },
      });

      res.render("admin/banner/bannerEdit", {
        banner,
        title,
        session: req.session.user,
      });
    } catch (error) {
      console.error("Error fetching banner:", error);
      req.flash("msg", "Error fetching banner details.");
      res.redirect("/admin/bannerListing");
    }
  },

  banner_update: async (req, res) => {
    try {
      const { id, title } = req.body;
      let bannerImage = "";

      if (req.files && req.files.bannerImage) {
        bannerImage = await helper.fileUpload(req.files.bannerImage, "images");
      } else {
        let existingBanner = await Models.bannerModel.findOne({
          where: { id },
        });
        bannerImage = existingBanner ? existingBanner.bannerImage : "";
      }

      await Models.bannerModel.update(
        { title, bannerImage },
        { where: { id } }
      );

      return res.json({
        success: true,
        message: "Banner updated successfully.",
      });
    } catch (error) {
      console.error("Error updating banner:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  traitsexperience_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let traitsexperience_data = await Models.traitsExperienceModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/traitsexperience/traitsexperienceListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Traits & Experience",
        traitsexperience_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  traitsexperience_add: async (req, res) => {
    try {
      let title = "Traits & Experience";
      res.render("admin/traitsexperience/traitsexperienceAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  traitsexperience_create: async (req, res) => {
    try {
      let objToSave = {
        title: req.body.title,
      };

      await Models.traitsExperienceModel.create(objToSave);

      return res.json({
        success: true,
        message: "traits and experience added successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  traitsexperience_delete: async (req, res) => {
    try {
      const traitsexperienceId = req.body.id;
      await Models.traitsExperienceModel.destroy({
        where: { id: traitsexperienceId },
      });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "Failed to delete traits and experience " });
      return res.redirect("/admin/login");
    }
  },

  numberofmembers_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let numberofmembers_data = await Models.numberOfMembersModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/numberofmembers/numberofmembersListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Number of Members",
        numberofmembers_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  numberofmembers_add: async (req, res) => {
    try {
      let title = "Number of Members";
      res.render("admin/numberofmembers/numberofmembersAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  numberofmembers_create: async (req, res) => {
    try {
      let objToSave = {
        title: req.body.title,
      };

      await Models.numberOfMembersModel.create(objToSave);

      return res.json({
        success: true,
        message: "number of members added successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  numberofmembers_delete: async (req, res) => {
    try {
      const numberofmembersId = req.body.id;
      await Models.numberOfMembersModel.destroy({
        where: { id: numberofmembersId },
      });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete number of members " });
      return res.redirect("/admin/login");
    }
  },

  maritalstatus_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let maritalstatus_data = await Models.maritalStatusModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/maritalstatus/maritalstatusListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Marital Status",
        maritalstatus_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  maritalstatus_add: async (req, res) => {
    try {
      let title = "Marital Status";
      res.render("admin/maritalstatus/maritalstatusAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  maritalstatus_create: async (req, res) => {
    try {
      let objToSave = {
        title: req.body.title,
      };

      await Models.maritalStatusModel.create(objToSave);

      return res.json({
        success: true,
        message: "marital status added successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  maritalstatus_delete: async (req, res) => {
    try {
      const maritalstatusId = req.body.id;
      await Models.maritalStatusModel.destroy({
        where: { id: maritalstatusId },
      });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete marital status " });
      return res.redirect("/admin/login");
    }
  },

  hearttoserve_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let hearttoserve_data = await Models.heartToServeModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/hearttoserve/hearttoserveListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Heart To Serve",
        hearttoserve_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  hearttoserve_add: async (req, res) => {
    try {
      let title = "Heart To Serve";
      res.render("admin/hearttoserve/hearttoserveAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  hearttoserve_create: async (req, res) => {
    try {
      let objToSave = {
        title: req.body.title,
      };

      await Models.heartToServeModel.create(objToSave);

      return res.json({
        success: true,
        message: "heart to serve added successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  hearttoserve_delete: async (req, res) => {
    try {
      const hearttoserveId = req.body.id;
      await Models.heartToServeModel.destroy({ where: { id: hearttoserveId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete heart to serve " });
      return res.redirect("/admin/login");
    }
  },

  profilepreference_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let profilepreference_data = await Models.profilePreferenceModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/profilepreference/profilepreferenceListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Profile Preference",
        profilepreference_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  profilepreference_add: async (req, res) => {
    try {
      let title = "Profile Preference";
      res.render("admin/profilepreference/profilepreferenceAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  profilepreference_create: async (req, res) => {
    try {
      let objToSave = {
        title: req.body.title,
      };

      await Models.profilePreferenceModel.create(objToSave);

      return res.json({
        success: true,
        message: "profile preference added successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  profilepreference_delete: async (req, res) => {
    try {
      const profilepreferenceId = req.body.id;
      await Models.profilePreferenceModel.destroy({
        where: { id: profilepreferenceId },
      });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete profile preference " });
      return res.redirect("/admin/login");
    }
  },

  filterTestimonies_listing: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");
      let filtertestimonies_data = await Models.filterTestimoniesModel.findAll({
        order: [["createdAt", "DESC"]],
        raw: true,
      });
      res.render("admin/filtertestimonies/filtertestimoniesListing", {
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
        title: "Filter Testimonies",
        filtertestimonies_data,
      });
    } catch (error) {
      console.log(error);
      return res.redirect("/admin/login");
    }
  },

  filterTestimonies_add: async (req, res) => {
    try {
      let title = "Filter Testimonies";
      res.render("admin/filtertestimonies/filtertestimoniesAdd", {
        title,
        session: req.session.user,
        msg: req.flash("msg") || "",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
      return res.redirect("/admin/login");
    }
  },

  filterTestimonies_create: async (req, res) => {
    try {
      let objToSave = {
        title: req.body.title,
      };

      await Models.filterTestimoniesModel.create(objToSave);

      return res.json({
        success: true,
        message: "Filter added successfully.",
      });
    } catch (error) {
      console.error(error);
      return res.json({ success: false, message: "Internal Server Error." });
    }
  },

  filterTestimonies_delete: async (req, res) => {
    try {
      const filterTestimoniesId = req.body.id;
      await Models.filterTestimoniesModel.destroy({ where: { id: filterTestimoniesId } });
      res.json({ success: true });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to delete filter" });
      return res.redirect("/admin/login");
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
