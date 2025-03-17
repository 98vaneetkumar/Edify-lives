module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "likePrayerRequest",
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
        prayerRequestId:{
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "prayerRequest", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
      },
      {
        timestamps: true,
        tableName: "likePrayerRequest",
      }
    );
  };
  