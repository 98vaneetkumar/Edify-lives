const path = require("path");
const { v4: uuid } = require("uuid");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const ffmpeg = require('fluent-ffmpeg');


const emailTamplate = require("./emailTemplate/forgetPassword");

module.exports = {
  success: async (res, message, body = {}) => {
    try {
      return res.status(200).json({  
        'success': true,
        'code': 200,
        'message': message,
        'body': body
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  failed: async (res, msg, body = {}) => {
    try {
      return res.status(400).json({ 
        'success': false,
        'message': msg,
        'code': 400,
        'body': {}
       });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  error: async (res, msg, body = {}) => {
    try {
      return res.status(500).json({ 
        'success': false,
        'message': msg,
        'code': 500,
        'body': {}
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  fileUpload: async (file, folder = "images") => {
    try {
      if (!file || file.name === "") return null;

      // Get file extension
      let fileExtension = file.name.split(".").pop();

      // Generate unique file name using uuid
      const name = uuid() + "." + fileExtension;

      // Create the correct path by referencing 'public/images' folder
      const filePath = path.join(__dirname, "..", "public", folder, name);

      // Move the file to the desired folder
      file.mv(filePath, (err) => {
        if (err) throw err;
      });

      // Return the file path relative to the public folder (this will be accessible via URL)
      return `/images/${name}`;
    } catch (error) {
      console.error("Error during file upload:", error);
      return null;
    }
  },
  uploadThumbnailOnly: async (videoPath, folder = "images") => {
    try {
      // Generate a random name for the thumbnail
      const letters = "ABCDE1234567890FGHJK1234567890MNPQRSTUXY";
      let thumbnailName = "";
      while (thumbnailName.length < 28) {
        const randIndex = Math.floor(Math.random() * letters.length);
        thumbnailName += letters[randIndex];
      }
      const thumbnailExt = "jpg"; // Thumbnail extension
      const thumbnailFullName = `${thumbnailName}.${thumbnailExt}`;
  
      console.log("🚀 ~ thumbnailFullName:", thumbnailFullName);
  
      // Define the path where the thumbnail will be saved
      const thumbnailPath = `public/${folder}/${thumbnailFullName}`;
  
      // Create a promise to generate and store the thumbnail
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath) // Use the provided video path
          .screenshots({
            timestamps: ["05%"], // Capture a thumbnail at 5% of the video duration
            filename: thumbnailFullName,
            folder: `public/${folder}`,
            size: "320x240",
          })
          .on("end", () => {
            console.log("Thumbnail generated successfully:", thumbnailFullName);
  
            // Return the relative URL path like `/images/filename.jpg`
            resolve(`/${folder}/${thumbnailFullName}`);
          })
          .on("error", (err) => {
            console.error("Error generating thumbnail:", err);
            reject(err);
          });
      });
    } catch (error) {
      console.error("Error in uploadThumbnailOnly:", error);
      throw error;
    }
  },  
  bcryptData: async (newPassword, salt) => {
    try {
      // Ensure `salt` is a number if passed as a string
      const saltRounds = typeof salt === "string" ? parseInt(salt, 10) : salt;

      // Hash the password using the salt rounds
      return await bcrypt.hash(newPassword, saltRounds);
    } catch (error) {
      console.log("bcrypt User error", error);
      throw error;
    }
  },

  getHost: async (req, res) => {
    const host =
      req.headers.host || `${req.hostname}:${req.connection.localPort}`;
    return host;
  },

  sidIdGenerateTwilio: async (req, res) => {
    try {
      const serviceSid = await otpManager.createServiceSID("appCleaning", "4");
      console.log("Service SID created:", serviceSid);
      return serviceSid;
    } catch (error) {
      console.error("Error generating Service SID:", error);
      throw new Error("Failed to generate Service SID");
    }
  },

  randomStringGenerate: async (req, res) => {
    try {
      return crypto.randomBytes(32).toString("hex");
    } catch (error) {
      console.log("randomString generate error", error);
      throw error;
    }
  },

  nodeMailer: async (req, res) => {
    try {
      let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false, // Set to `true` for port 465, `false` for port 587
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
      });
      return transporter;
    } catch (error) {
      console.log("nodeMailer error", error);
      throw error;
    }
  },

  forgetPasswordLinkHTML: async (req,user, resetUrl,subject) => {
    try {
      let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: user.email,
        subject: subject,
        html: await emailTamplate.forgetPasswordLinkHTML(req,resetUrl),
      };
      return mailOptions;
    } catch (error) {
      console.log("forgetPassword error", error);
      throw error;
    }
  },

  session: async (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      return res.redirect("/admin/login");
    }
  },

};
