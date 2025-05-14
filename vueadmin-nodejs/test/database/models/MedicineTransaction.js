const { sequelize, Sequelize } = require('../init.js');

// 药品交易表（统一管理入库和出库）
const MedicineTransaction = sequelize.define('medicine_transaction', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '交易ID'
    },
    code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '交易单号'
    },
    type: {
        type: Sequelize.ENUM('in', 'out'),
        allowNull: false,
        comment: '交易类型：in-入库，out-出库'
    },
    supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '供应商ID（入库时使用）'
    },
    supplier_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '供应商名称（入库时使用）'
    },
    entry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '交易日期'
    },
    total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '总金额'
    },
    status: {
        type: Sequelize.ENUM('pending', 'approved', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '状态：待审核、已审核、已取消'
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
    approver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '审核人ID'
    },
    approver_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '审核人姓名'
    },
    approve_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '审核时间'
    },
    approve_remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '审核备注'
    },
    cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '取消原因'
    },
    cancel_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '取消时间'
    },
    remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
    },
    prescription_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '处方ID'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medicine_transactions'
});

// 定义关联关系
MedicineTransaction.associate = (models) => {
    // 与操作员关联
    MedicineTransaction.belongsTo(models.User, {
        foreignKey: 'operator_id',
        as: 'operator'
    });

    // 与审核人关联
    MedicineTransaction.belongsTo(models.User, {
        foreignKey: 'approver_id',
        as: 'approver'
    });

    // 与供应商关联（入库时）
    MedicineTransaction.belongsTo(models.Supplier, {
        foreignKey: 'supplier_id',
        as: 'supplier'
    });


    // 与交易明细关联
    MedicineTransaction.hasMany(models.MedicineTransactionItem, {
        foreignKey: 'transaction_id',
        as: 'items'
    });
};

// 同步模型到数据库
MedicineTransaction.sync({ alter: true }).then(() => {
    console.log("药品交易表模型已同步!");
}).catch(err => {
    console.error("药品交易表同步错误:", err.message);
});

module.exports = MedicineTransaction;
