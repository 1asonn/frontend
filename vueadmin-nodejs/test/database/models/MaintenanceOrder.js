const { sequelize, Sequelize } = require('../init.js');

const MaintenanceOrder = sequelize.define('maintenance_order', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '工单ID'
    },
    order_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '工单编号'
    },
    equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: '设备ID，关联医疗设备表'
    },
    equipment_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '设备名称'
    },
    equipment_code: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '设备编号'
    },
    equipment_model: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '设备型号'
    },
    department: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '所属科室'
    },
    location: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '存放位置'
    },
    manufacturer: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '制造商'
    },
    status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '工单状态：待处理、处理中、已完成、已取消'
    },
    fault_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '故障类型'
    },
    fault_description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '故障描述'
    },
    reporter: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '报修人'
    },
    reporter_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: '报修人ID，关联users表'
    },
    contact_phone: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '联系电话'
    },
    priority: {
        type: Sequelize.ENUM('high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
        comment: '紧急程度：高、中、低'
    },
    remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
    },
    assignee: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '处理人名称（冗余字段）'
    },
    assignee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: '处理人ID，关联users表'
    },
    estimated_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '预计完成时间'
    },
    process_remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '处理备注'
    },
    process_result: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '处理结果'
    },
    cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        comment: '维修费用'
    },
    create_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '创建时间'
    },
    process_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '开始处理时间'
    },
    complete_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '完成时间'
    },
    cancel_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '取消时间'
    },
    images: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '工单相关图片数组，JSON格式存储图片URL'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'maintenance_orders'
});

// 定义关联关系
MaintenanceOrder.associate = (models) => {
    // 注释掉与不存在的MedicalEquipment模型的关联
    // MaintenanceOrder.belongsTo(models.MedicalEquipment, {
    //     foreignKey: 'equipment_id',
    //     as: 'equipment'
    // });
    
    MaintenanceOrder.hasMany(models.MaintenanceHistory, {
        foreignKey: 'order_id',
        as: 'history_records'
    });
    
    // 关联到User表，处理人
    MaintenanceOrder.belongsTo(models.User, {
        foreignKey: 'assignee_id',
        as: 'assignee_info'
    });
    
    // 关联到User表，报修人/创建者
    MaintenanceOrder.belongsTo(models.User, {
        foreignKey: 'reporter_id',
        as: 'creator_info'
    });
};

// 使用alter: true来更新表结构，包括新增字段
try {
    MaintenanceOrder.sync({ alter: true }).then(() => {
        console.log("维修工单表同步完成，包括新增字段");
    }).catch(err => {
        console.error("维修工单表同步错误，但不影响应用启动:", err.message);
    });
} catch (error) {
    console.error("维修工单表同步异常:", error.message);
    console.log("应用将继续启动，但维修工单表可能需要手动更新");
}

module.exports = MaintenanceOrder;
