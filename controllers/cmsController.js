const Models = require("../models/index");

module.exports = {
    aboutUs: async (req, res) => {
        try {
            console.log("------->>>>>")
          if (!req.session.user) return res.redirect("/login");
      
          let about_data = await Models.cmsModel.findOne({
            where: { accessor: "About" },
          });
      
          res.redirect("/admin/about", {
            title: "About Us",
            about_data,
            session: req.session.user,
            msg: req.flash("msg"),
            error: req.flash("error"),
          });
        } catch (error) {
          console.log(error);
          res.redirect("/login");
        }
      },
      
  about_post: async (req, res) => {
    try {
      let data = await Models.cmsModel.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: { accessor: "About" },
        }
      );
      req.flash("msg", "About Us updated successfully");
      res.redirect("/aboutUs");
    } catch (error) {
      console.log(error);
    }
  },

  imprint: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/login");
      let imprint = await Models.cmsModel.findOne({
        where: { accessor: "Imprint" },
      });
      res.render("cms/Imprint", {
        title: "Imprint",
        imprint,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
    }
  },
  imprint_post: async (req, res) => {
    try {
      let data = await Models.cmsModel.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: { accessor: "Imprint" },
        }
      );
      req.flash("msg", "Imprint  updated successfully");
      res.redirect("/imprint");
    } catch (error) {
      console.log(error);
    }
  },
  privacyPolicy: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/login");
      let policy_data = await Models.cmsModel.findOne({
        where: { accessor: "Privacy" },
      });
      res.render("cms/privacy", {
        title: "Privacy Policy",
        policy_data,
        session: req.session.user,
        msg: req.flash("msg"),
        error: req.flash("error"),
      });
    } catch (error) {
      console.log(error);
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
          where: { accessor: "Privacy" },
        }
      );
      req.flash("msg", "Privacy Policy updated successfully");
      res.redirect("/privacyPolicy");
    } catch (error) {
      console.log(error);
    }
  },
  termsConditions: async (req, res) => {
    try {
      if (!req.session.user) return res.redirect("/login");
      let terms_data = await Models.cmsModel.findOne({
        where: { accessor: "terms" },
      });
      res.render("cms/terms", {
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
          where: { accessor: "terms" },
        }
      );
      req.flash("msg", "Terms and Conditions updated successfully");
      res.redirect("/termsConditions");
    } catch (error) {
      console.log(error);
    }
  },
};
