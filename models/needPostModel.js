module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
      "needPost",
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
        title: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        city:{
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        zipCode:{
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
      },
      {
        timestamps: true,
        tableName: "needPost",
      }
    );
  };
  