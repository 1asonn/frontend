const User = require('./user');
const Role = require('./Role');
const Department = require('./Department');
const Schedule = require('./Schedule');
const ShiftSetting = require('./ShiftSetting');

// 初始化模型关联关系
const initializeAssociations = () => {
    // 调用每个模型的 associate 方法
    const models = {
        User,
        Role,
        Department,
        Schedule,
        ShiftSetting
    };

    Object.values(models).forEach(model => {
        if (typeof model.associate === 'function') {
            model.associate(models);
        }
    });
};

// 执行关联初始化
initializeAssociations();

module.exports = {
    User,
    Role,
    Department,
    Schedule,
    ShiftSetting
};
