const { sequelize,Sequelize } = require("../init.js")


const Patient = sequelize.define('patient',{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    name:{
       type:Sequelize.STRING,
       validate:{
           notEmpty:true
       }
    },
    medicalId:{
       type:Sequelize.STRING,
       validate:{
           notEmpty:true
       }
    },
    gender:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    birthday:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    idCard:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    phone:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    address:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
    },
    medicalHistory:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:false
        }
    }

})

Patient.sync().then(() =>{
    console.log('patient表模型已同步!')
})

module.exports = Patient