const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../index');
const MedicalEquipment = require('./medical_equipment');

const EquipmentMaintenance = sequelize.define('equipment_maintenance', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '维修记录ID'
    },
    equipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: MedicalEquipment,
            key: 'id'
        },
        comment: '设备ID'
    },
    maintenance_type: {
        type: DataTypes.ENUM('routine', 'repair', 'calibration'),
        allowNull: false,
        comment: '维护类型：routine-例行保养，repair-故障维修，calibration-校准'
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '维护开始日期'
    },
    end_date: {
        type: DataTypes.DATE,
        comment: '维护结束日期'
    },
    maintenance_staff: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '维护人员'
    },
    fault_description: {
        type: DataTypes.TEXT,
        comment: '故障描述'
    },
    maintenance_details: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '维护内容'
    },
    parts_replaced: {
        type: DataTypes.TEXT,
        comment: '更换配件'
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '维护费用'
    },
    status: {
        type: DataTypes.ENUM('in_progress', 'completed', 'pending'),
        defaultValue: 'in_progress',
        comment: '维护状态：in_progress-进行中，completed-已完成，pending-待处理'
    },
    result: {
        type: DataTypes.ENUM('success', 'partial', 'failed'),
        comment: '维护结果：success-完全修复，partial-部分修复，failed-未修复'
    },
    next_maintenance_date: {
        type: DataTypes.DATE,
        comment: '下次维护日期'
    },
    maintenance_company: {
        type: DataTypes.STRING(200),
        comment: '维护公司'
    },
    company_contact: {
        type: DataTypes.STRING(50),
        comment: '公司联系人'
    },
    company_phone: {
        type: DataTypes.STRING(20),
        comment: '公司联系电话'
    },
    warranty_covered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '是否在保修期内'
    },
    remarks: {
        type: DataTypes.TEXT,
        comment: '备注'
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
    tableName: 'equipment_maintenance',
    comment: '医疗设备维修记录表'
});

// 建立关联关系
EquipmentMaintenance.belongsTo(MedicalEquipment, {
    foreignKey: 'equipment_id',
    as: 'equipment'
});

MedicalEquipment.hasMany(EquipmentMaintenance, {
    foreignKey: 'equipment_id',
    as: 'maintenance_records'
});

module.exports = EquipmentMaintenance;
