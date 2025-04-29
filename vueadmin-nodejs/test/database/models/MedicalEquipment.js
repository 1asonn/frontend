const { sequelize, Sequelize } = require('../init.js');

const MedicalEquipment = sequelize.define('medical_equipment', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '设备ID'
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '设备名称'
    },
    equipment_code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '设备编号'
    },
    model: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '设备型号'
    },
    department: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '所属科室名称（冗余字段）'
    },
    department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        comment: '科室ID，关联departments表'
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
    purchase_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '购买日期'
    },
    warranty_period: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '保修期（月）'
    },
    status: {
        type: Sequelize.ENUM('normal', 'maintenance', 'scrapped'),
        allowNull: false,
        defaultValue: 'normal',
        comment: '设备状态：正常、维修中、已报废'
    },
    last_maintenance_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '上次维护日期'
    },
    next_maintenance_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '下次维护日期'
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '设备描述'
    },
    price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: '设备价格'
    },
    created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '创建人ID'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'medical_equipment'
});

// 定义关联关系
MedicalEquipment.associate = (models) => {
    MedicalEquipment.hasMany(models.MaintenanceOrder, {
        foreignKey: 'equipment_id',
        as: 'maintenance_records'
    });
    
    MedicalEquipment.belongsTo(models.Department, {
        foreignKey: 'department_id',
        as: 'department_info'
    });
};

// 使用force: false只创建不存在的表，不修改现有表结构
try {
    MedicalEquipment.sync({ force: false }).then(() => {
        console.log("医疗设备表检查完成");
    }).catch(err => {
        console.error("医疗设备表同步错误，但不影响应用启动:", err.message);
    });
} catch (error) {
    console.error("医疗设备表同步异常:", error.message);
    console.log("应用将继续启动，但医疗设备表可能需要手动更新");
}

module.exports = MedicalEquipment;
