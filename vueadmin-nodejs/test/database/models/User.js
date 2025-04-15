const {sequelize,Sequelize} = require('../init.js')

const User = sequelize.define('user',{
    id:{
        type:Sequelize.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        comment:'用户ID'
    },
    username:{
        type:Sequelize.STRING,
        allowNull:false,
        unique:true,
        comment:'用户名'
    },
    password:{
        type:Sequelize.STRING,
        allowNull:false,
        comment:'密码'
    },
    realname:{
        type:Sequelize.STRING,
        allowNull:false,
        comment:'姓名'
    },
    gender:{
        type:Sequelize.STRING,
        allowNull:false,
        comment:'性别'
    },
    birth_date:{
        type:Sequelize.DATE,
        comment:'出生日期'
    },
    address:{
        type:Sequelize.STRING,
        comment:'住址'
    },
    role_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{
            model:'roles',
            key:'id'
        },
        comment:'角色ID'
    },
    department_id:{
        type:Sequelize.INTEGER,
        allowNull:false,
        references:{
            model:'departments',
            key:'id'
        },
        comment:'部门ID'
    }
},{
    timestamps:true,
    underscored:true,
    tableName:'users'
})

// 定义关联关系
User.associate = (models) => {
    User.belongsTo(models.Role,{
        foreignKey:'role_id',
        as:'role'
    })
    
    User.belongsTo(models.Department,{
        foreignKey:'department_id',
        as:'department'
    })

    User.hasMany(models.Schedule,{
        foreignKey:'employee_id',
        as:'schedules'
    })

    User.hasMany(models.ShiftSetting,{
        foreignKey:'created_by',
        as:'created_shifts'
    })
}

User.sync().then(() => {
    console.log("用户表模型已同步!")
})

module.exports = User