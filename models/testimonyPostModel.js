module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "testimonyPost",
      {
        ...require("./cors")(Sequelize, DataTypes),
        userId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "users", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        testimoryType:{
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
        growingUp: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        beforeJesus: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        findJesus: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        faithInJesus: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
      },
      {
        timestamps: true,
        tableName: "testimonyPost",
      }
    );
  };
  