const { sequelize, Sequelize } = require('../init.js');
const User = require('./user');
const Department = require('./department');

const Schedule = sequelize.define('schedule', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '排班ID'
  },
  employee_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '职工ID'
  },
  department_id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'departments',
      key: 'id'
    },
    comment: '部门ID'
  },
  monday: {
    type: Sequelize.STRING,
    comment: '周一'
  },
  tuesday: {
    type: Sequelize.STRING,
    comment: '周二'
  },
  wednesday: {
    type: Sequelize.STRING,
    comment: '周三'
  },
  thursday: {
    type: Sequelize.STRING,
    comment: '周四'
  },
  friday: {
    type: Sequelize.STRING,
    comment: '周五'
  },
  saturday: {
    type: Sequelize.STRING,
    comment: '周六'
  },
  sunday: {
    type: Sequelize.STRING,
    comment: '周日'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'schedules'
});

// 定义关联关系
Schedule.belongsTo(User, {
  foreignKey: 'employee_id',
  as: 'employee'
});

Schedule.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department'
});

// 不需要额外的ScheduleShift关联，直接使用monday-sunday字段存储班次ID

Schedule.sync({ alter: true }).then(() => {
  console.log("排班表模型已同步!")
});

module.exports = Schedule;
