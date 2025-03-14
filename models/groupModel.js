module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "group",
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
        groupName: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
        groupType: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
        groupDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        groupLogo: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "",
        },
      },
      {
        timestamps: true,
        tableName: "group",
      }
    );
  };
  