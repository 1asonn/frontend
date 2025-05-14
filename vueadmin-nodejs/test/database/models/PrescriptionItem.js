const { sequelize, Sequelize } = require('../init.js');

// 处方药品表 - 记录处方中包含的药品明细
const PrescriptionItem = sequelize.define('prescription_item', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '处方药品ID'
    },
    prescription_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '处方ID'
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '药品名称'
    },
    spec: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '规格'
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '数量'
    },
    unit: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '盒',
        comment: '单位'
    },
    usage: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '用法用量'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'prescription_items'
});

// 定义关联关系
PrescriptionItem.associate = (models) => {
    // 与处方关联
    PrescriptionItem.belongsTo(models.Prescription, {
        foreignKey: 'prescription_id',
        as: 'prescription'
    });

    // 与药品关联
    PrescriptionItem.belongsTo(models.MedicineStock, {
        foreignKey: 'medicine_id',
        as: 'medicine'
    });
};

// 同步模型到数据库
PrescriptionItem.sync({ alter: true }).then(() => {
    console.log("处方药品表模型已同步!");
}).catch(err => {
    console.error("处方药品表同步错误:", err.message);
});

module.exports = PrescriptionItem;
