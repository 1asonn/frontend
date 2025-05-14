const { sequelize,Sequelize } = require("../init.js")


const MedicalRecord = sequelize.define('medical_record',{
    recordId:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    patientId:{
        type:Sequelize.INTEGER,
        references:{
            model:'patients',
            key:'id'
        }    
    },
    date:{
       type:Sequelize.STRING,
       validate:{
           notEmpty:true
       }
    },
    doctorId :{
       type:Sequelize.INTEGER,
       allowNull: false,
       references:{
           model:'users',
           key:'id'
       },
       validate:{
           notEmpty:true
       }
    },
    symptoms:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    diagnosticResults:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    treatment:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    }

},{timestamps: true})

// 定义关联关系
MedicalRecord.associate = (models) => {
    // 与医生关联
    MedicalRecord.belongsTo(models.User, {
        foreignKey: 'doctorId',
        as: 'doctor'
    });
    
    // 与患者关联
    MedicalRecord.belongsTo(models.Patient, {
        foreignKey: 'patientId',
        as: 'patient'
    });
};

MedicalRecord.sync().then(() =>{
    console.log('medical_record表模型已同步!')
})

module.exports = MedicalRecord