module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "events",
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
      eventType:{
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      address:{
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    latitude:{
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
        longitude:{
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        date:{
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        time:{
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        eventTitle:{
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
    countryCode:{
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
        phoneNumber:{
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        email:{
            type: Sequelize.STRING(255),
            allowNull: true,
            defaultValue: null,
        },
        eventDescription:{
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
      {
        timestamps: true,
        tableName: "events",
      }
    );
  };
  