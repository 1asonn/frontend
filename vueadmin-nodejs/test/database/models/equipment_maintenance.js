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
    // 基本关联信息
    equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: MedicalEquipment,
            key: 'id'
        },
        comment: '设备ID'
    },
    maintenance_order_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '关联的维修工单ID'
    },
    order_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '关联的工单编号'
    },
    
    // 维修类型
    maintenance_type: {
        type: Sequelize.ENUM('preventive', 'repair', 'calibration'),
        allowNull: false,
        defaultValue: 'repair',
        comment: '维修类型：预防性维护、故障维修、校准'
    },
    
    // 时间跟踪
    start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '开始日期'
    },
    end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '结束日期'
    },
    
    // 人员信息
    operator_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: User,
            key: 'id'
        },
        comment: '操作人员ID'
    },
    operator: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '操作人员名称'
    },
    
    // 故障和维修详情
    fault_description: {
        type: Sequelize.TEXT,
        comment: '故障描述'
    },
    maintenance_details: {
        type: Sequelize.TEXT,
        comment: '维修详情'
    },
    
    total_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '维护总费用'
    },
    
    // 其他信息
    remarks: {
        type: Sequelize.TEXT,
        comment: '备注'
    },
    
    // 时间戳
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
