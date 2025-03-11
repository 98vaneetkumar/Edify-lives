module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "videos",
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
        video: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
        thumbnail: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
        caption:{
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        }
      },
      {
        timestamps: true,
        tableName: "videos",
      }
    );
  };
  