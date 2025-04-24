const { sequelize, Sequelize } = require('../init.js');

const MedicalEquipment = sequelize.define('medical_equipment', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '设备ID'
    },
    equipment_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '设备编号'
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '设备名称'
    },
    model: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '设备型号'
    },
    manufacturer: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '生产厂商'
    },
    purchase_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '购买日期'
    },
    warranty_period: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '保修期限'
    },
    department: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '使用科室'
    },
    location: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '存放位置'
    },
    status: {
        type: Sequelize.ENUM('normal', 'maintenance', 'scrapped'),
        defaultValue: 'normal',
        comment: '设备状态：normal-正常使用，maintenance-维修中，scrapped-已报废'
    },
    last_maintenance_date: {
        type: Sequelize.DATE,
        comment: '上次维护日期'
    },
    next_maintenance_date: {
        type: Sequelize.DATE,
        comment: '下次维护日期'
    },
    responsible_person: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '责任人'
    },
    contact_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '联系电话'
    },
    purchase_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: '购买价格'
    },
    service_life: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '预计使用年限'
    },
    description: {
        type: Sequelize.TEXT,
        comment: '设备描述'
    },
    image_url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '设备图片URL'
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
    tableName: 'medical_equipment',
    comment: '医疗设备表'
});

// 同步模型到数据库，使用 alter: true 选项更新表结构
MedicalEquipment.sync({ alter: true }).then(() => {
    console.log("医疗设备表模型已同步并更新!");
});

module.exports = MedicalEquipment;
