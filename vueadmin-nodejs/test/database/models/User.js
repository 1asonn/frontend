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
    phone:{
        type:Sequelize.STRING,
        allowNull:true,
        unique:true,
        comment:'手机号码'
    },
    identity:{
        type:Sequelize.STRING,
        allowNull:true,
        comment:'身份证号码'
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
    
    // 关联到MaintenanceOrder表，作为处理人
    if (models.MaintenanceOrder) {
        User.hasMany(models.MaintenanceOrder, {
            foreignKey: 'assignee_id',
            as: 'assigned_orders'
        })
        
        // 关联到MaintenanceOrder表，作为创建人
        User.hasMany(models.MaintenanceOrder, {
            foreignKey: 'created_by',
            as: 'created_orders'
        })
    }
}

// 添加获取脱敏手机号码的方法
User.prototype.getMaskedPhone = function() {
    if (!this.phone) return null;
    return this.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1xxxx$2');
};

// 添加重试机制的函数
const syncWithRetry = async (model, options, maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await model.sync(options);
      console.log("用户表模型已同步!");
      return;
    } catch (error) {
      retries++;
      if (error.code === 'ER_LOCK_DEADLOCK' && retries < maxRetries) {
        console.log(`同步遇到死锁，正在进行第 ${retries} 次重试...`);
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      } else {
        console.error("同步失败:", error);
        throw error;
      }
    }
  }
};

// 使用重试机制进行同步，但不修改表结构
try {
  // 使用force: false只创建不存在的表，不修改现有表结构
  User.sync({ force: false }).then(() => {
    console.log("用户表检查完成");
  }).catch(err => {
    console.error("用户表同步错误，但不影响应用启动:", err.message);
  });
} catch (error) {
  console.error("用户表同步异常:", error.message);
  // 即使同步失败，也不影响应用启动
  console.log("应用将继续启动，但用户表可能需要手动更新");
}

module.exports = User