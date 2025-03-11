module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "likeNeedPost",
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
        needPostId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "needPost", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
      },
      {
        timestamps: true,
        tableName: "likeNeedPost",
      }
    );
  };
  