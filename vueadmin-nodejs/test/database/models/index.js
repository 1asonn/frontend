const User = require('./user');
const Role = require('./Role');
const Department = require('./Department');
const Schedule = require('./Schedule');
const ShiftSetting = require('./ShiftSetting');
const MaintenanceOrder = require('./MaintenanceOrder');
const MaintenanceHistory = require('./MaintenanceHistory');
const Supplier = require('./supplier');
const Medicine = require('./Medicine');
const MedicineTransaction = require('./MedicineTransaction');
const MedicineTransactionItem = require('./MedicineTransactionItem');
const MedicineStock = require('./MedicineStock');
const MedicineStockHistory = require('./MedicineStockHistory');

// 初始化模型关联关系
const initializeAssociations = () => {
    // 调用每个模型的 associate 方法
    const models = {
        User,
        Role,
        Department,
        Schedule,
        ShiftSetting,
        MaintenanceOrder,
        MaintenanceHistory,
        Supplier,
        Medicine,
        MedicineTransaction,
        MedicineTransactionItem,
        MedicineStock,
        MedicineStockHistory
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
    ShiftSetting,
    MaintenanceOrder,
    MaintenanceHistory,
    Supplier,
    Medicine,
    MedicineTransaction,
    MedicineTransactionItem,
    MedicineStock,
    MedicineStockHistory
};
