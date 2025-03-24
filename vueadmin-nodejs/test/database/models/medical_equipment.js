const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../index');

const MedicalEquipment = sequelize.define('medical_equipment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '设备ID'
    },
    equipment_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '设备编号'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '设备名称'
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '设备型号'
    },
    manufacturer: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '生产厂商'
    },
    purchase_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '购买日期'
    },
    warranty_period: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '保修期限'
    },
    department: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '所属科室'
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '存放位置'
    },
    status: {
        type: DataTypes.ENUM('normal', 'maintenance', 'scrapped'),
        defaultValue: 'normal',
        comment: '设备状态：normal-正常使用，maintenance-维修中，scrapped-已报废'
    },
    last_maintenance_date: {
        type: DataTypes.DATE,
        comment: '上次维护日期'
    },
    next_maintenance_date: {
        type: DataTypes.DATE,
        comment: '下次维护日期'
    },
    responsible_person: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '负责人'
    },
    contact_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '联系电话'
    },
    purchase_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: '购买价格'
    },
    service_life: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '预计使用年限'
    },
    description: {
        type: DataTypes.TEXT,
        comment: '设备描述'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
        comment: '创建时间'
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
        comment: '更新时间'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medical_equipment',
    comment: '医疗设备表'
});

module.exports = MedicalEquipment;
