const { sequelize, Sequelize } = require('../init.js');

// 药品交易明细表
const MedicineTransactionItem = sequelize.define('medicine_transaction_item', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '交易明细ID'
    },
    transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '交易单ID'
    },
    medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '药品ID'
    },
    medicine_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '药品名称'
    },
    specification: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '规格'
    },
    unit: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '单位'
    },
    batch_number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '批号'
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '数量'
    },
    price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '单价'
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '金额'
    },
    production_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '生产日期'
    },
    expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '有效期至'
    },
    location: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '存放位置'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medicine_transaction_items'
});

// 定义关联关系
MedicineTransactionItem.associate = (models) => {
    // 与交易单表关联
    MedicineTransactionItem.belongsTo(models.MedicineTransaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
    });

    // 与药品表关联
    MedicineTransactionItem.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
    });
};

// 同步模型到数据库
MedicineTransactionItem.sync({ alter: true }).then(() => {
    console.log("药品交易明细表模型已同步!");
}).catch(err => {
    console.error("药品交易明细表同步错误:", err.message);
});

module.exports = MedicineTransactionItem;
