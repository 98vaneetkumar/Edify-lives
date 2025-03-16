module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "addFeed",
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
        description:{
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        image:{
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
      },
      {
        timestamps: true,
        tableName: "addFeed",
      }
    );
  };
  