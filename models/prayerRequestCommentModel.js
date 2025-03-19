module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "prayerRequestComments",
      {
        ...require("./cors")(Sequelize, DataTypes),
        prayerRequestId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "prayerRequest",
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
        tableName: "prayerRequestComments",
      }
    );
  };
  