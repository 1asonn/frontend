/**
 * 数据库表同步脚本
 * 按照正确的依赖顺序创建数据库表
 */

const { sequelize } = require('./init');
const path = require('path');
const fs = require('fs');

// 导入模型前先禁用自动同步
const originalSync = sequelize.Sequelize.Model.sync;
sequelize.Sequelize.Model.sync = function() {
  console.log(`阻止模型自动同步: ${this.name}`);
  return Promise.resolve();
};

// 导入所有模型 - 使用相对路径确保文件名大小写正确
// 注意：在Windows上文件名大小写不敏感，但在其他系统上是敏感的
// 使用相对路径导入，确保与实际文件名大小写一致
const Role = require('./models/Role');
const Department = require('./models/department'); // 修正为实际文件名小写
const User = require('./models/user'); // 修正为实际文件名小写
const Schedule = require('./models/Schedule');
const ShiftSetting = require('./models/ShiftSetting');
const Supplier = require('./models/supplier');
const Medicine = require('./models/medicine');
const MedicineStock = require('./models/MedicineStock');
const MedicineStockHistory = require('./models/MedicineStockHistory');
const MedicineTransaction = require('./models/MedicineTransaction');
const MedicineTransactionItem = require('./models/MedicineTransactionItem');
const MaintenanceOrder = require('./models/MaintenanceOrder');
const MaintenanceHistory = require('./models/MaintenanceHistory');

// 恢复原始同步方法
sequelize.Sequelize.Model.sync = originalSync;

// 尝试导入其他可能存在的模型
let MedicalEquipment;
try {
  MedicalEquipment = require('./models/medical_equipment');
} catch (error) {
  console.log('医疗设备模型不存在，跳过加载');
}

let AiAgent;
try {
  AiAgent = require('./models/AiAgent');
} catch (error) {
  console.log('AI代理模型不存在，跳过加载');
}

let Patients;
try {
  Patients = require('./models/Patients');
} catch (error) {
  console.log('患者模型不存在，跳过加载');
}

let MedicalRecord;
try {
  MedicalRecord = require('./models/MedicalRecord');
} catch (error) {
  console.log('医疗记录模型不存在，跳过加载');
}

// 按照依赖关系对模型进行排序 - 更精确的依赖顺序
const modelSequence = [
  // 第一层：没有外键依赖的基础表
  { name: 'Role', model: Role },
  { name: 'Department', model: Department },
  { name: 'Supplier', model: Supplier },
  { name: 'Medicine', model: Medicine },
  ...(AiAgent ? [{ name: 'AiAgent', model: AiAgent }] : []),
  
  // 第二层：依赖第一层表的表
  { name: 'User', model: User }, // 依赖 Role, Department
  { name: 'ShiftSetting', model: ShiftSetting }, // 依赖 Department
  { name: 'MedicineStock', model: MedicineStock }, // 依赖 Medicine
  ...(MedicalEquipment ? [{ name: 'MedicalEquipment', model: MedicalEquipment }] : []),
  ...(Patients ? [{ name: 'Patients', model: Patients }] : []),
  
  // 第三层：依赖第二层表的表
  { name: 'Schedule', model: Schedule }, // 依赖 User, ShiftSetting
  { name: 'MaintenanceOrder', model: MaintenanceOrder }, // 依赖 User, MedicalEquipment
  { name: 'MedicineTransaction', model: MedicineTransaction }, // 依赖 User
  { name: 'MedicineStockHistory', model: MedicineStockHistory }, // 依赖 MedicineStock
  ...(MedicalRecord ? [{ name: 'MedicalRecord', model: MedicalRecord }] : []), // 依赖 Patients, User
  
  // 第四层：依赖第三层表的表
  { name: 'MaintenanceHistory', model: MaintenanceHistory }, // 依赖 MaintenanceOrder, User
  { name: 'MedicineTransactionItem', model: MedicineTransactionItem }, // 依赖 MedicineTransaction, Medicine
];

// 同步模型的函数 - 增加重试机制和更多错误处理
async function syncModel(model, modelName, force = false, alter = true) {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`开始同步模型: ${modelName}`);
      const options = { alter };
      if (force) {
        options.force = true;
      }
      
      // 禁用外键检查，以便可以按任意顺序创建表
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // 同步模型
      await model.sync(options);
      
      // 重新启用外键检查
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log(`模型 ${modelName} 同步成功`);
      return true;
    } catch (error) {
      retries++;
      
      // 尝试重新启用外键检查，以防出错时它仍处于禁用状态
      try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        console.log('重新启用外键检查失败，但这不影响继续执行');
      }
      
      if (retries < maxRetries) {
        const waitTime = 1000 * retries;
        console.log(`模型 ${modelName} 同步失败，等待 ${waitTime}ms 后进行第 ${retries} 次重试...`);
        console.error(`错误信息: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`模型 ${modelName} 同步失败 (已重试 ${retries} 次):`, error.message);
        return false;
      }
    }
  }
}

// 按顺序同步模型
async function syncModelsSequentially(models, force = false) {
  console.log('\n===== 开始按顺序同步模型 =====');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { name, model } of models) {
    const success = await syncModel(model, name, force);
    if (success) {
      successCount++;
    } else {
      failCount++;
      console.log(`警告: ${name} 模型同步失败，继续同步其他模型...`);
    }
  }
  
  console.log(`===== 模型同步完成: 成功 ${successCount}, 失败 ${failCount} =====\n`);
}

// 初始化关联关系
function initializeAssociations() {
  console.log('初始化模型关联关系...');
  
  // 构建模型对象
  const models = {
    Role,
    Department,
    User,
    Schedule,
    ShiftSetting,
    Supplier,
    Medicine,
    MedicineStock,
    MedicineStockHistory,
    MedicineTransaction,
    MedicineTransactionItem,
    MaintenanceOrder,
    MaintenanceHistory
  };
  
  // 添加可选模型
  if (MedicalEquipment) models.MedicalEquipment = MedicalEquipment;
  if (AiAgent) models.AiAgent = AiAgent;
  if (Patients) models.Patients = Patients;
  if (MedicalRecord) models.MedicalRecord = MedicalRecord;
  
  // 调用每个模型的 associate 方法
  Object.values(models).forEach(model => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });
  
  console.log('模型关联关系初始化完成');
}

// 主函数
async function main() {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 初始化关联关系
    initializeAssociations();
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const noConfirm = args.includes('--no-confirm');
    const skipForeignKeys = args.includes('--skip-foreign-keys');
    
    if (force && !noConfirm) {
      console.log('警告: 将使用 force 模式，这将删除现有表并重新创建');
      console.log('5秒后开始执行，按 Ctrl+C 取消...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 如果指定了跳过外键检查，则禁用外键检查
    if (skipForeignKeys) {
      console.log('禁用外键检查，以便可以按任意顺序创建表');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    }
    
    try {
      // 同步所有模型 - 使用顺序同步而不是分组
      await syncModelsSequentially(modelSequence, force);
      
      console.log('\n所有数据库表同步完成！');
    } finally {
      // 确保重新启用外键检查
      if (skipForeignKeys) {
        console.log('重新启用外键检查');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      }
      
      // 关闭数据库连接
      await sequelize.close();
      console.log('数据库连接已关闭');
    }
    
  } catch (error) {
    console.error('发生错误:', error);
    
    // 尝试关闭数据库连接
    try {
      await sequelize.close();
    } catch (e) {
      console.error('关闭数据库连接失败:', e.message);
    }
    
    process.exit(1);
  }
}

// 执行主函数
main();
