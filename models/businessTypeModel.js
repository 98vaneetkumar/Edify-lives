module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "businessType",
      {
        ...require("./cors")(Sequelize, DataTypes),

        title: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
  
      },
      {
        timestamps: true,
        tableName: "businessType",
      }
    );
  };
  