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

  logout: async (req, res) => {
    try {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } catch (error) {
      console.log(error);
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
        message:
          "Your password has been updated successfully! You will be redirected to the login page to log in again.",
      });
    } catch (error) {
      console.log(error);
    }
  },

  dashboard: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/admin/login");

    // Fetch all counts in parallel
    const [user, churches, business, nonprofit, subscription] = await Promise.all([
        Models.userModel.count({ where: { role: 1 } }),
        Models.userModel.count({ where: { role: 2 } }),
        Models.userModel.count({ where: { role: 3 } }),
        Models.userModel.count({ where: { role: 4 } }),
        Models.subscriptionModel.count(),
    ]);

    const currentYear = moment().year();
    const months = [];
    const counts = { users: [], churches: [], business: [], nonprofit: [] };

    const startOfYear = moment(`${currentYear}-01-01`, "YYYY-MM-DD").startOf("year").toDate();
    const endOfYear = moment(startOfYear).endOf("year").toDate();

    // Single query to get counts for all months and roles
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

    // Initialize counts with 0 for all months
    for (let month = 1; month <= 12; month++) {
        months.push(moment(`${currentYear}-${month}-01`, "YYYY-MM-DD").format("MMM, YYYY"));
        counts.users.push(0);
        counts.churches.push(0);
        counts.business.push(0);
        counts.nonprofit.push(0);
    }

    // Populate counts from query result
    monthlyCounts.forEach(({ month, role, count }) => {
        if (role == 1) counts.users[month - 1] = count;
        else if (role == 2) counts.churches[month - 1] = count;
        else if (role == 3) counts.business[month - 1] = count;
        else if (role == 4) counts.nonprofit[month - 1] = count;
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
      return res.redirect("/admin/subscriptionListing");
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
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
    }
  },

  subscription_edit: async (req, res) => {
    try {
      let title = "Subscription Edit";
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
