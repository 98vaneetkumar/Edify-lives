module.exports = (Sequelize, sequelize, DataTypes) => {
    return sequelize.define(
        "subscription",
        {
            ...require("./cors")(Sequelize, DataTypes),
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                defaultValue: "",
            },
            type: {
                type: DataTypes.INTEGER(11),
                allowNull: true,
                defaultValue: 0, // 0 for basic 1 for premium
            },
            period: {
                type: DataTypes.STRING(50),
                allowNull: true,
                defaultValue: "",
            },
            amount: {
                type: DataTypes.DECIMAL(10, 2), 
                allowNull: true,
                defaultValue: 0.00,
            },
        },
        {
            timestamps: true,
            tableName: "subscription",
        }
    );
};
