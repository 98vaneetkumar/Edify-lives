module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "christianSeekingEmp",
      {
        ...require("./cors")(Sequelize, DataTypes),

        bannerImage:{
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue:''
        },
  
      },
      {
        timestamps: true,
        tableName: "christianSeekingEmp",
      }
    );
  };
  