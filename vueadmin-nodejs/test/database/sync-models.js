const { sequelize } = require('./init');

// 设置更长的查询超时时间
sequelize.options.dialectOptions = {
  ...sequelize.options.dialectOptions,
  connectTimeout: 60000, // 60秒连接超时
  acquireTimeout: 60000, // 60秒获取连接超时
};

// 按照依赖关系顺序导入模型
const models = {};

// 尝试加载模型，如果模型不存在则忽略错误
function tryRequire(path) {
  try {
    return require(path);
  } catch (error) {
    console.warn(`警告: 无法加载模型 ${path}，跳过此模型`);
    return null;
  }
}

// 第一层：基础表（不依赖其他表的表）
models.Role = tryRequire('./models/Role');
models.Department = tryRequire('./models/department'); // 注意文件名小写
models.Supplier = tryRequire('./models/supplier');
models.AiAgent = tryRequire('./models/AiAgent');

// 第二层：依赖第一层表的表
models.User = tryRequire('./models/user'); // 注意文件名小写，依赖Role和Department
models.Patient = tryRequire('./models/Patients');
models.ShiftSetting = tryRequire('./models/ShiftSetting'); // 依赖Department
models.Medicine = tryRequire('./models/medicine');
models.MedicalEquipment = tryRequire('./models/medical_equipment');

// 第三层：依赖第二层表的表
models.Schedule = tryRequire('./models/Schedule'); // 依赖User和ShiftSetting
models.MedicalRecord = tryRequire('./models/MedicalRecord'); // 依赖Patient和User
models.MaintenanceOrder = tryRequire('./models/MaintenanceOrder'); // 依赖User和MedicalEquipment
models.MedicineStock = tryRequire('./models/MedicineStock'); // 依赖Medicine
models.MedicineTransaction = tryRequire('./models/MedicineTransaction'); // 依赖User

// 第四层：依赖第三层表的表
models.MaintenanceHistory = tryRequire('./models/MaintenanceHistory'); // 依赖MaintenanceOrder
models.MedicineStockHistory = tryRequire('./models/MedicineStockHistory'); // 依赖MedicineStock
models.MedicineTransactionItem = tryRequire('./models/MedicineTransactionItem'); // 依赖MedicineTransaction和Medicine
models.EquipmentMaintenance = tryRequire('./models/equipment_maintenance'); // 旧表，可能已被MaintenanceOrder替代

// 同步单个模型的函数，包含重试逻辑
async function syncModelWithRetry(model, modelName, maxRetries = 3, options = { alter: true }) {
  if (!model) {
    console.log(`跳过不存在的模型: ${modelName}`);
    return;
  }
  
  let retries = 0;
  while (retries < maxRetries) {
    try {
      // 禁用外键检查，以便可以按任意顺序创建表
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // 同步模型
      await model.sync(options);
      
      // 重新启用外键检查
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log(`${modelName}表同步完成`);
      return;
    } catch (error) {
      retries++;
      
      // 尝试重新启用外键检查，以防出错时它仍处于禁用状态
      try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (e) {
        console.log('重新启用外键检查失败，但这不影响继续执行');
      }
      
      if (retries < maxRetries && (
          error.name === 'SequelizeDatabaseError' || 
          error.name === 'SequelizeConnectionError' ||
          error.original?.code === 'ER_LOCK_DEADLOCK' ||
          error.original?.code === 'ER_FK_CANNOT_OPEN_PARENT')) {
        console.log(`同步${modelName}表时发生错误，正在重试 (${retries}/${maxRetries})...`);
        console.log(`错误信息: ${error.message}`);
        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      } else {
        console.error(`同步${modelName}表时发生错误:`, error);
        if (retries >= maxRetries) {
          console.error(`已达到最大重试次数(${maxRetries})，跳过此模型`);
          return; // 达到最大重试次数后跳过，而不是抛出错误
        } else {
          throw error; // 非数据库错误，直接抛出
        }
      }
    }
  }
}

// 按顺序同步模型到数据库
async function syncModels() {
  try {
    console.log('开始同步数据库模型...');
    
    // 测试数据库连接
    try {
      await sequelize.authenticate();
      console.log('数据库连接成功！');
    } catch (error) {
      console.error('无法连接到数据库:', error);
      return;
    }
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const options = force ? { force: true } : { alter: true };
    
    if (force) {
      console.log('警告: 使用force模式，将删除现有表并重新创建');
      console.log('5秒后开始执行，按Ctrl+C取消...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 第一阶段：同步基础表
    console.log('第一阶段：同步基础表...');
    await syncModelWithRetry(models.Role, '角色', 3, options);
    await syncModelWithRetry(models.Department, '部门', 3, options);
    await syncModelWithRetry(models.Supplier, '供应商', 3, options);
    await syncModelWithRetry(models.AiAgent, 'AI代理', 3, options);
    
    // 第二阶段：同步依赖基础表的表
    console.log('第二阶段：同步依赖基础表的表...');
    await syncModelWithRetry(models.User, '用户', 3, options);
    await syncModelWithRetry(models.Patient, '患者', 3, options);
    await syncModelWithRetry(models.ShiftSetting, '班次设置', 3, options);
    await syncModelWithRetry(models.Medicine, '药品', 3, options);
    await syncModelWithRetry(models.MedicalEquipment, '医疗设备', 3, options);
    
    // 第三阶段：同步依赖第二阶段表的表
    console.log('第三阶段：同步依赖第二阶段表的表...');
    await syncModelWithRetry(models.Schedule, '排班', 3, options);
    await syncModelWithRetry(models.MedicalRecord, '就诊记录', 3, options);
    await syncModelWithRetry(models.MaintenanceOrder, '维护工单', 3, options);
    await syncModelWithRetry(models.MedicineStock, '药品库存', 3, options);
    await syncModelWithRetry(models.MedicineTransaction, '药品交易', 3, options);
    
    // 第四阶段：同步依赖第三阶段表的表
    console.log('第四阶段：同步依赖第三阶段表的表...');
    await syncModelWithRetry(models.MaintenanceHistory, '维护历史', 3, options);
    await syncModelWithRetry(models.MedicineStockHistory, '药品库存历史', 3, options);
    await syncModelWithRetry(models.MedicineTransactionItem, '药品交易项', 3, options);
    await syncModelWithRetry(models.EquipmentMaintenance, '设备维护(旧)', 3, options);
    
    console.log('所有模型已成功同步到数据库！');
    
  } catch (error) {
    console.error('同步模型时出错:', error);
  } finally {
    // 确保关闭数据库连接
    try {
      await sequelize.close();
      console.log('数据库连接已关闭');
    } catch (closeError) {
      console.error('关闭数据库连接时出错:', closeError);
    }
  }
}

// 执行同步
syncModels();
