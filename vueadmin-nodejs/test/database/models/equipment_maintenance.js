const { sequelize, Sequelize } = require('../init.js');
const MedicalEquipment = require('./medical_equipment');
const User = require('./User');

const EquipmentMaintenance = sequelize.define('equipment_maintenance', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '维修记录ID'
    },
    equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: MedicalEquipment,
            key: 'id'
        },
        comment: '设备ID'
    },
    operator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        comment: '操作员工ID'
    },
    operator: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '操作员工'
    },
    maintenance_type: {
        type: Sequelize.ENUM('routine', 'repair', 'calibration'),
        allowNull: false,
        comment: '维护类型：routine-例行保养，repair-故障维修，calibration-校准'
    },
    start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '维护开始日期'
    },
    end_date: {
        type: Sequelize.DATE,
        comment: '维护结束日期'
    },
    maintenance_staff: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '维护人员'
    },
    fault_description: {
        type: Sequelize.TEXT,
        comment: '故障描述'
    },
    maintenance_details: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '维护内容'
    },
    parts_replaced: {
        type: Sequelize.TEXT,
        comment: '更换配件'
    },
    cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '维护费用'
    },
    status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'pending'),
        defaultValue: 'in_progress',
        comment: '维护状态：in_progress-进行中，completed-已完成，pending-待处理'
    },
    result: {
        type: Sequelize.ENUM('success', 'partial', 'failed'),
        comment: '维护结果：success-完全修复，partial-部分修复，failed-未修复'
    },
    next_maintenance_date: {
        type: Sequelize.DATE,
        comment: '下次维护日期'
    },
    maintenance_company: {
        type: Sequelize.STRING(200),
        comment: '维护公司'
    },
    company_contact: {
        type: Sequelize.STRING(50),
        comment: '公司联系人'
    },
    company_phone: {
        type: Sequelize.STRING(20),
        comment: '公司联系电话'
    },
    warranty_covered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '是否在保修期内'
    },
    remarks: {
        type: Sequelize.TEXT,
        comment: '备注'
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
    tableName: 'equipment_maintenance',
    comment: '医疗设备维修记录表'
});

// 建立关联关系
EquipmentMaintenance.belongsTo(MedicalEquipment, {
    foreignKey: 'equipment_id',
    as: 'equipment'
});

EquipmentMaintenance.belongsTo(User, {
    foreignKey: 'operator_id',
    as: 'operator_info'
});

MedicalEquipment.hasMany(EquipmentMaintenance, {
    foreignKey: 'equipment_id',
    as: 'maintenance_records'
});

User.hasMany(EquipmentMaintenance, {
    foreignKey: 'operator_id',
    as: 'maintenance_records'
});

// 同步模型到数据库
async function syncModels() {
    try {
        // 按顺序同步表结构
        await MedicalEquipment.sync();
        console.log("医疗设备表模型已同步!");
        
        await EquipmentMaintenance.sync();
        console.log("医疗设备维修记录表模型已同步!");
    } catch (error) {
        console.error("同步模型时出错:", error);
    }
}

syncModels();

module.exports = EquipmentMaintenance;
