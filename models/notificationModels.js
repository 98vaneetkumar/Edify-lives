module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "notifications",
      {
        ...require("./cors")(Sequelize, DataTypes),
        senderId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "users", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        recevierId:{
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
  