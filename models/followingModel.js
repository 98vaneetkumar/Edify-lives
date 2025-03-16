module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "follow",
      {
        ...require("./cors")(Sequelize, DataTypes),
        followerId :{  //who do follow
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "users", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        followingId :{ //who is following
            type: Sequelize.UUID,
            allowNull: false,
            references: {
                model: "users", // name of Target model
                key: "id", // key in Target model that we"re referencing
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
      },
      {
        timestamps: true,
        tableName: "follow",
      }
    );
  };
  