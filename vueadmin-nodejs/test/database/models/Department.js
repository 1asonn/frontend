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
};

Department.sync().then(() => {
    console.log("部门表模型已同步!")
})

module.exports = Department
