module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "commentFeed",
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
        feedId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "addFeed", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        comment:{
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
      },
      {
        timestamps: true,
        tableName: "commentFeed",
      }
    );
  };
  