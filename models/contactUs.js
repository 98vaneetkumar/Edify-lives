module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "constantUs",
      {
        ...require("./cors")(Sequelize, DataTypes),
        name: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: "",
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: "",
        },
        phone: {
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: "",
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: "",
          },
      },
      {
        timestamps: true,
        tableName: "constantUs",
      }
    );
  };
  