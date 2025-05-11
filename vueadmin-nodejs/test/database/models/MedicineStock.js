const { sequelize, Sequelize } = require('../init.js');

// 药品库存表
const MedicineStock = sequelize.define('medicine_stock', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '库存ID'
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
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '当前库存数量'
    },
    unit: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '单位'
    },
    specification: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '规格'
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
    },
    supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '供应商ID'
    },
    last_update_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '最后更新时间'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medicine_stocks',
    indexes: [
        {
            unique: true,
            fields: ['medicine_id', 'batch_number'],
            name: 'medicine_batch_unique'
        }
    ]
});

// 定义关联关系
MedicineStock.associate = (models) => {
    // 与药品表关联
    MedicineStock.belongsTo(models.Medicine, {
        foreignKey: 'medicine_id',
        as: 'medicine'
    });
};

// 同步模型到数据库
// 使用force: true强制更新表结构，注意：在生产环境中谨慎使用
MedicineStock.sync({ alter: true, force: false }).then(() => {
    console.log("药品库存表模型已同步!");
    // 检查数据库表结构
    return sequelize.query("SHOW COLUMNS FROM medicine_stocks LIKE 'supplier_id'");
}).then(([results]) => {
    if (results.length === 0) {
        // 如果列不存在，手动添加
        console.log('手动添加 supplier_id 列');
        return sequelize.query("ALTER TABLE medicine_stocks ADD COLUMN supplier_id INT COMMENT '供应商ID'");
    } else {
        console.log('supplier_id 列已存在');
        return Promise.resolve();
    }
}).catch(err => {
    console.error("药品库存表同步错误:", err.message);
});

module.exports = MedicineStock;
