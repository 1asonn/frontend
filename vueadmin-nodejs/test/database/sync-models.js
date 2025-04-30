const { sequelize } = require('./init');

// 设置更长的查询超时时间
sequelize.options.dialectOptions = {
  ...sequelize.options.dialectOptions,
  connectTimeout: 60000, // 60秒连接超时
  acquireTimeout: 60000, // 60秒获取连接超时
};

// 按照依赖关系顺序导入模型
// 1. 基础表（不依赖其他表的表）
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

// 基础表
models.Role = tryRequire('./models/Role');
models.Department = tryRequire('./models/Department');
models.User = tryRequire('./models/User');
models.Patient = tryRequire('./models/Patients');
models.ShiftSetting = tryRequire('./models/ShiftSetting');

// 依赖基础表的表
models.Schedule = tryRequire('./models/Schedule');
models.MedicalRecord = tryRequire('./models/MedicalRecord');
models.MedicalEquipment = tryRequire('./models/medical_equipment');
models.Medicine = tryRequire('./models/medicine');

// 依赖上述表的表
models.EquipmentMaintenance = tryRequire('./models/equipment_maintenance');
models.MedicineStock = tryRequire('./models/medicine_stock');

// 同步单个模型的函数，包含重试逻辑
async function syncModelWithRetry(model, modelName, maxRetries = 3) {
  if (!model) {
    console.log(`跳过不存在的模型: ${modelName}`);
    return;
  }
  
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await model.sync({ alter: true });
      console.log(`${modelName}表同步完成`);
      return;
    } catch (error) {
      retries++;
      if (error.name === 'SequelizeDatabaseError' || 
          error.name === 'SequelizeConnectionError' ||
          error.original?.code === 'ER_LOCK_DEADLOCK') {
        console.log(`同步${modelName}表时发生错误，正在重试 (${retries}/${maxRetries})...`);
        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      } else {
        console.error(`同步${modelName}表时发生错误:`, error);
        throw error; // 非数据库错误，直接抛出
      }
    }
  }
  throw new Error(`同步${modelName}表失败，已重试${maxRetries}次`);
}

// 按顺序同步模型到数据库
async function syncModels() {
  let connection = null;
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
    
    // 第一阶段：同步基础表
    console.log('第一阶段：同步基础表...');
    await syncModelWithRetry(models.Role, '角色');
    await syncModelWithRetry(models.Department, '部门');
    await syncModelWithRetry(models.User, '用户');
    await syncModelWithRetry(models.Patient, '患者');
    await syncModelWithRetry(models.ShiftSetting, '班次设置');
    
    // 第二阶段：同步依赖基础表的表
    console.log('第二阶段：同步依赖基础表的表...');
    await syncModelWithRetry(models.Schedule, '排班');
    await syncModelWithRetry(models.MedicalRecord, '就诊记录');
    await syncModelWithRetry(models.MedicalEquipment, '医疗设备');
    await syncModelWithRetry(models.Medicine, '药品');
    
    // 第三阶段：同步依赖上述表的表
    console.log('第三阶段：同步依赖上述表的表...');
    await syncModelWithRetry(models.EquipmentMaintenance, '设备维护');
    await syncModelWithRetry(models.MedicineStock, '药品库存');
    
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
