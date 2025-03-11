module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "users",
    {
      ...require("./cors")(Sequelize, DataTypes),
      role:{
        type: DataTypes.INTEGER,  // 0 for admin 1 for personal 2 for church 3 for Business and 4 for Non-profit
        allowNull: false,
        defaultValue: 1
      },
      //1. Personal functions
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue:''
      },

      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue:''
      },
     socialType:{
       type: DataTypes.INTEGER,
       allowNull: true,   // 1 FOR GOOOGLE 2 FOR FACEBOOK 
       defaultValue:0
      },
      socialId:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      countryCode: {
        type: DataTypes.STRING(5),
        allowNull: true,
        defaultValue:''
     },
      phoneNumber: {
        type: DataTypes.STRING(15),
        allowNull: true,
        defaultValue:''
      },

      password: {
        type: DataTypes.STRING(60),
        allowNull: true,
        defaultValue:''
      },
      otpVerify: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue:0
      }, 
      gender: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue:''
      },
      maritalStatus: {
        type: DataTypes.INTEGER(10),
        allowNull: true,
        defaultValue:null  // 1 for married 0 for not married
      },
      location:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      latitude:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      longitude:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      donateEdifyLivers:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      traitAndExperience:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      postEmpSeekingSection:{
        type: DataTypes.INTEGER, // would you like profile posted on the employement seeking section
        allowNull: true,
        defaultValue:0 //0 means no 1 for yes 
      },
      hartOfService:{ 
        type: DataTypes.STRING,  // who do you have the heart to serve
        allowNull: true,
        defaultValue:0  // 0 means no 1 for yes
      },
      profilePicture: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },


      //2. Church details
      churchName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      churchWebsite: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      churchAccessCode:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      numberOfMembers:{
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue:0
      },
      visionStatement:{
        type: DataTypes.STRING(255), //FILE UPLOAD
        allowNull: true,
        defaultValue:''
      },
      valuesStatement:{
        type: DataTypes.STRING(255), //FILE UPLOAD
        allowNull: true,
        defaultValue:''
      },

      //3.Business fileds
      businessName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      typeOfBusiness: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      businessAddress:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      businessUserAddress:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      businessLogo:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },

      //4.Non Profit fields
      nameNonProfit: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      addressNonProfit: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      webSiteNonProfile:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      nonProfitServe:{
        type: DataTypes.INTEGER(25),
        allowNull: true,
        defaultValue:0
      },
      nonPorfitOrganization:{ 
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },
      chruchAttendAddress: {
        type: Sequelize.UUID, // Correct type for UUID
        allowNull: true,
        references: {
            model: "users",  // Target model name
            key: "id",       // Referencing the correct primary key
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    },    
      companyLogo:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },


      // ===============
      resetToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:null
      },

      resetTokenExpires: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue:null
      },

      deviceToken: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },

      deviceType: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue:''
      },

    },
    {
      timestamps: true,
      tableName: "users",
    }
  );
};
