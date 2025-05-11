const { sequelize, Sequelize } = require("../init.js");
const Medicine = require('./medicine');
const MedicineStock = require('./medicine_stock');
const User = require('./User');

const MedicineStockHistory = sequelize.define('medicine_stock_history', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '库存变更记录ID'
    },
    medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: Medicine,
            key: 'id'
        },
        comment: '药品ID'
    },
    stock_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: MedicineStock,
            key: 'id'
        },
        comment: '库存记录ID'
    },
    batch_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '批号'
    },
    operation_type: {
        type: Sequelize.ENUM('stock_in', 'stock_out', 'return', 'adjustment', 'expired'),
        allowNull: false,
        comment: '操作类型：入库、出库、退货、调整、过期'
    },
    quantity_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '操作前数量'
    },
    quantity_change: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '变更数量'
    },
    quantity_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '操作后数量'
    },
    operator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        },
        comment: '操作人ID'
    },
    operator_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '操作人姓名'
    },
    operation_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '操作时间'
    },
    remark: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '备注'
    },
    related_order: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '关联单号（如处方单号、采购单号等）'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medicine_stock_history',
    comment: '药品库存变更记录表'
});

// 建立关联关系
MedicineStockHistory.belongsTo(Medicine, {
    foreignKey: 'medicine_id',
    as: 'medicine'
});

MedicineStockHistory.belongsTo(MedicineStock, {
    foreignKey: 'stock_id',
    as: 'stock'
});

MedicineStockHistory.belongsTo(User, {
    foreignKey: 'operator_id',
    as: 'operator'
});

// 同步模型到数据库
MedicineStockHistory.sync().then(() => {
    console.log('medicine_stock_history表模型已同步!');
});

module.exports = MedicineStockHistory;
