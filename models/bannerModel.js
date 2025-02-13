module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "banner",
      {
        ...require("./cors")(Sequelize, DataTypes),

        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
        
        bannerImage:{
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue:''
        },
  
      },
      {
        timestamps: true,
        tableName: "banner",
      }
    );
  };
  