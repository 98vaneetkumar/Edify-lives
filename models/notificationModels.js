/*
1 for comment on need post, 
 2 for like on need post, 
 3 for comment on testimony post, 
 4 for like on testimony post
 5 for like on video
 6 for comment on video
 7 for comment on group post
 8 for like on group post
 9 for like on feed
 10 for comment on feed
 11 follow you
*/

module.exports = (Sequelize, sequelize, DataTypes) => {
  return sequelize.define(
    "notifications",
    {
      ...require("./cors")(Sequelize, DataTypes),
      senderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users", // name of Target model
          key: "id", // key in Target model that we"re referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      recevierId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users", // name of Target model
          key: "id", // key in Target model that we"re referencing
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      isRead: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      timestamps: true,
      tableName: "notifications",
    }
  );
};
