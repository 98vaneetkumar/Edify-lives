require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const fileUpload = require("express-fileupload");
const swaggerUi = require("swagger-ui-express");
const session = require("express-session");
const flash = require("connect-flash");

const indexRouter = require("./routes/index");
const adminRouter = require("./routes/adminRouter")();
const usersRouter = require("./routes/userRoute")();
const chruchRouter = require("./routes/churchRouter")();
const businessRouter = require("./routes/businessRouter")();
const nonProfitRouter = require("./routes/nonProfitRouter")();

const app = express();

require("./dbConnection").connectdb();

// view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Enable file upload using express-fileupload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

console.log("port")
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 365 * 1000,
    },
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.msg = req.flash("msg");
  res.locals.error = req.flash("error");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: "/user",
        name: "User API",
      },
      {
        url: "/church",
        name: "Church API",
      },
      {
        url: "/business",
        name: "Business API",
      },
      {
        url: "/nonProfit",
        name: "Non Profit API",
      },
    ],
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));

app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/users", usersRouter);
app.use("/church", chruchRouter);
app.use("/business", businessRouter);
app.use("/nonProfit", nonProfitRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
