const {sequelize,Sequelize} = require('../init.js')

const Department = sequelize.define('department',{
     id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        validate:{
            notEmpty:true
        }
     },
     name:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        },
        comment: '部门名称'
     },
     description:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:false
        },
        comment: '部门描述'
     }
})

Department.sync().then(() => {
    console.log("部门表模型已同步!")
})

module.exports = Department
