const { sequelize, Sequelize } = require('../init.js');

const Schedule = sequelize.define('schedule', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      notEmpty: true
    }
  },
  employeeId: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    comment: '职工ID'
  },
  departmentId: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    comment: '部门ID'
  },
  employeeName: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    },
    comment: '职工姓名'
  },
  monday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周一工作时间'
  },
  tuesday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周二工作时间'
  },
  wednesday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周三工作时间'
  },
  thursday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周四工作时间'
  },
  friday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周五工作时间'
  },
  saturday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周六工作时间'
  },
  sunday: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: false
    },
    comment: '周日工作时间'
  }
}, {
  tableName: 'schedules',
  timestamps: true
});

Schedule.sync().then(() => {
  console.log("排班表模型已同步!")
});

module.exports = Schedule;
