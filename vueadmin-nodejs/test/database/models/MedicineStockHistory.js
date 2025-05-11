const { sequelize, Sequelize } = require('../init.js');

// 药品库存历史表
const MedicineStockHistory = sequelize.define('medicine_stock_history', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '历史记录ID'
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
    batch_number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '批号'
    },
    transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '关联的交易ID'
    },
    transaction_code: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '交易单号'
    },
    transaction_type: {
        type: Sequelize.ENUM('in', 'out'),
        allowNull: false,
        comment: '交易类型：in-入库，out-出库'
    },
    quantity_change: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '数量变化（正数表示增加，负数表示减少）'
    },
    quantity_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '变化前数量'
    },
    quantity_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '变化后数量'
    },
    operator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '操作员ID'
    },
    operator_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '操作员姓名'
    },
    operation_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '操作时间'
    },
    remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medicine_stock_histories'
});

// 定义关联关系
MedicineStockHistory.associate = (models) => {
    // 与药品表关联
    MedicineStockHistory.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
    });

    // 与交易表关联
    MedicineStockHistory.belongsTo(models.MedicineTransaction, {
        foreignKey: 'transaction_id',
        as: 'transaction'
    });

    // 与操作员关联
    MedicineStockHistory.belongsTo(models.User, {
        foreignKey: 'operator_id',
        as: 'operator'
    });
};

// 同步模型到数据库
MedicineStockHistory.sync({ alter: true }).then(() => {
    console.log("药品库存历史表模型已同步!");
}).catch(err => {
    console.error("药品库存历史表同步错误:", err.message);
});

module.exports = MedicineStockHistory;
