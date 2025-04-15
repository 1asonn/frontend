const {sequelize,Sequelize} = require('../init.js')

const Role = sequelize.define('role',{
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '角色ID'
    },
    role_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '角色名称'
    },
    authoritys: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '权限列表'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'roles'
});

// 定义关联关系
Role.associate = (models) => {
    Role.hasMany(models.User, {
        foreignKey: 'role_id',
        as: 'users'
    });
};

Role.sync({ alter: true }).then(() => {
    console.log("角色表模型已同步!")
})

module.exports = Role