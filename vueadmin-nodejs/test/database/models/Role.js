const {sequelize,Sequelize} = require('../init.js')

const Role = sequelize.define('user',{
     id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        validate:{
            notEmpty:true
        }
     },
     role_name:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        } 
     },
     authoritys:{
        type:Sequelize.STRING,
        validate:{
            notEmpty:true
        }
     }
})


User.sync().then(() => {
    console.log("角色表模型已同步!")
})

module.exports = Role