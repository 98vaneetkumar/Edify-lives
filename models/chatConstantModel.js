module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "chatConstant",
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
        receiverId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "users", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        lastMessageId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "message", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
        },
        deletedLastMessageId:{
            type:DataTypes.INTEGER,
            allowNull: false,
            defaultValue:0
        }
      },
      {
        timestamps: true,
        tableName: "chatConstant",
      }
    );
  };
  