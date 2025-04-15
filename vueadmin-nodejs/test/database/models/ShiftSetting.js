const { sequelize, Sequelize } = require('../init.js');

const ShiftSetting = sequelize.define('shift_setting', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: Sequelize.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    },
    comment: '班次名称'
  },
  startTime: {
    type: Sequelize.TIME,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    comment: '上班时间'
  },
  endTime: {
    type: Sequelize.TIME,
    allowNull: false,
    validate: {
      notEmpty: true
    },
    comment: '下班时间'
  },
  description: {
    type: Sequelize.STRING(200),
    allowNull: true,
    comment: '班次描述'
  },
  isEnabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  },
  createdBy: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: '创建人ID'
  }
}, {
  tableName: 'shift_settings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

ShiftSetting.sync().then(() => {
  console.log("班次设置表模型已同步!")
});

module.exports = ShiftSetting;
