const { sequelize, Sequelize } = require("../init.js");
const Medicine = require('./medicine');

const MedicineStock = sequelize.define('medicine_stock', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '库存记录ID'
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
    batch_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '批号'
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: '库存数量'
    },
    status: {
        type: Sequelize.ENUM('in_stock', 'consumed', 'expired', 'returned'),
        defaultValue: 'in_stock',
        allowNull: false,
        comment: '库存状态：in_stock-在库，consumed-已使用，expired-已过期，returned-已退货'
    },
    unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: '单价'
    },
    production_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '生产日期'
    },
    expiry_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '有效期'
    },
    created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: '创建时间'
    },
    updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: '更新时间'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medicine_stocks',
    comment: '药品库存表'
});

// 建立关联关系
MedicineStock.belongsTo(Medicine, {
    foreignKey: 'medicine_id',
    as: 'medicine'
});

Medicine.hasMany(MedicineStock, {
    foreignKey: 'medicine_id',
    as: 'stocks'
});

MedicineStock.sync().then(() =>{
    console.log('medicine_stock表模型已同步!');
});

module.exports = MedicineStock;
