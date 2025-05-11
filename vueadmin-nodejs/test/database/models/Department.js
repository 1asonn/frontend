const {sequelize,Sequelize} = require('../init.js')

const Department = sequelize.define('department',{
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '部门ID'
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '部门名称'
    },
    description: {
        type: Sequelize.STRING,
        comment: '部门描述'
    },
    manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: '负责人ID'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'departments'
});

// 定义关联关系
Department.associate = (models) => {
    Department.hasMany(models.User, {
        foreignKey: 'department_id',
        as: 'employees'
    });
    Department.hasMany(models.Schedule, {
        foreignKey: 'department_id',
        as: 'schedules'
    });
    // 关联到MedicalEquipment模型
    if (models.MedicalEquipment) {
        Department.hasMany(models.MedicalEquipment, {
            foreignKey: 'department_id',
            as: 'equipments'
        });
    }
    // 关联到medical_equipment模型
    if (models.medical_equipment) {
        Department.hasMany(models.medical_equipment, {
            foreignKey: 'department_id',
            as: 'medical_equipments'
        });
    }
    // 关联到负责人
    if (models.User) {
        Department.belongsTo(models.User, {
            foreignKey: 'manager_id',
            as: 'manager'
        });
    }
};

Department.sync({ alter: true }).then(() => {
    console.log("部门表模型已同步!")
}).catch(err => {
    console.error("部门表同步错误:", err.message);
})

module.exports = Department
