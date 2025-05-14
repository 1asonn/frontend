const { sequelize, Sequelize } = require('../init.js');

// 处方表 - 记录医生给病人开具的处方信息
const Prescription = sequelize.define('prescription', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '处方ID'
    },
    prescription_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '处方编号'
    },
    patient_id: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '患者ID'
    },
    doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '医生ID'
    },
    doctor_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '医生姓名'
    },
    diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '诊断结果'
    },
    instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '医嘱'
    },
    prescription_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '处方日期'
    },
    status: {
        type: Sequelize.ENUM('pending', 'dispensed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '状态：待发药、已发药、已取消'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'prescriptions'
});

// 定义关联关系
Prescription.associate = (models) => {
    // 与医生关联
    Prescription.belongsTo(models.User, {
        foreignKey: 'doctor_id',
        as: 'doctor'
    });

    // 与处方药品关联
    Prescription.hasMany(models.PrescriptionItem, {
        foreignKey: 'prescription_id',
        as: 'items'
    });

    // 与交易单关联（出库时）
    Prescription.hasOne(models.MedicineTransaction, {
        foreignKey: 'prescription_id',
        as: 'transaction'
    });
};

// 同步模型到数据库
Prescription.sync({ alter: true }).then(() => {
    console.log("处方表模型已同步!");
}).catch(err => {
    console.error("处方表同步错误:", err.message);
});

module.exports = Prescription;
