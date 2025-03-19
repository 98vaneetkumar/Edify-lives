module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "dailyBreadComments",
      {
        ...require("./cors")(Sequelize, DataTypes),
        dailyBreadId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "dailyBread",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        commentBy: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
      },
      {
        timestamps: true,
        tableName: "dailyBreadComments",
      }
    );
  };
  