const {sequelize,Sequelize} = require('../init.js')

const User = sequelize.define('user',{
     username:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
     },
     password:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        } 
     },
     roleId:{
        type:Sequelize.INTEGER,
        references:{
            model:'roles',
            key:'id'
        }    
     },
     departmentId:{
        type:Sequelize.INTEGER,
        references:{
            model:'departments',
            key:'id'
        },
        comment: '部门ID'
     }
})


User.sync().then(() => {
    console.log("用户表模型已同步!")
})

module.exports = User