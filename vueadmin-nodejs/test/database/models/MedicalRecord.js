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
    attendingDoctor :{
       type:Sequelize.STRING,
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

MedicalRecord.sync().then(() =>{
    console.log('medical_record表模型已同步!')
})

module.exports = MedicalRecord