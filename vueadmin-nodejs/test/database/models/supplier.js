const { sequelize, Sequelize } = require('../init.js');

const Supplier = sequelize.define('supplier', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '供应商ID'
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '供应商名称'
    },
    contact_person: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '联系人'
    },
    contact_phone: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '联系电话'
    },
    address: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '地址'
    },
    notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
    },
    created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: '创建人ID'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'suppliers'
});

// 定义关联关系
Supplier.associate = (models) => {
    if (models.User) {
        Supplier.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });
    }
    
    if (models.Medicine) {
        Supplier.hasMany(models.Medicine, {
            foreignKey: 'supplier_id',
            as: 'medicines'
        });
    }
    
    if (models.MedicineStock) {
        Supplier.hasMany(models.MedicineStock, {
            foreignKey: 'supplier_id',
            as: 'stocks'
        });
    }
};

// 同步模型到数据库
Supplier.sync({ alter: true }).then(() => {
    console.log("供应商表模型已同步!");
}).catch(err => {
    console.error("供应商表同步错误:", err.message);
});

module.exports = Supplier;
