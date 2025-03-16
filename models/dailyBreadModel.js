module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "dailyBread",
        {
            ...require("./cors")(Sequelize, DataTypes),
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: "",
            },
        },
        {
            timestamps: true,
            tableName: "dailyBread",
        }
    );
};
