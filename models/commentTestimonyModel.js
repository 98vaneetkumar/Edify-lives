module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "commentTestimonyPost",
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
        testimonyPostId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "testimonyPost", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
      },
      {
        timestamps: true,
        tableName: "commentTestimonyPost",
      }
    );
  };
  