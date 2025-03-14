module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "likeGroup",
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
        groupId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "group", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
      },
      {
        timestamps: true,
        tableName: "likeGroup",
      }
    );
  };
  