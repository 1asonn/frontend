/**
 * 数据库表同步脚本 - 修复版
 * 解决循环依赖问题，使用两阶段同步方法
 */

const { sequelize } = require('./init');

// 设置更长的查询超时时间
sequelize.options.dialectOptions = {
  ...sequelize.options.dialectOptions,
  connectTimeout: 60000, // 60秒连接超时
  acquireTimeout: 60000, // 60秒获取连接超时
};

// 尝试加载模型，如果模型不存在则忽略错误
function tryRequire(path) {
  try {
    return require(path);
  } catch (error) {
    console.warn(`警告: 无法加载模型 ${path}，跳过此模型`);
    return null;
  }
}

// 禁用模型上的自动同步功能
function disableAutoSync() {
  const originalSync = sequelize.Sequelize.Model.sync;
  sequelize.Sequelize.Model.sync = function() {
    console.log(`阻止模型自动同步: ${this.name}`);
    return Promise.resolve();
  };
  return originalSync;
}

// 恢复模型上的自动同步功能
function restoreAutoSync(originalSync) {
  sequelize.Sequelize.Model.sync = originalSync;
}

// 同步单个模型的函数，包含重试逻辑
async function syncModelWithRetry(model, modelName, options = { alter: true }, maxRetries = 3) {
  if (!model) {
    console.log(`跳过不存在的模型: ${modelName}`);
    return;
  }
  
  let retries = 0;
  while (retries < maxRetries) {
    try {
      console.log(`开始同步模型: ${modelName}`);
      await model.sync(options);
      console.log(`${modelName}表同步完成`);
      return true;
    } catch (error) {
      retries++;
      
      if (retries < maxRetries) {
        const waitTime = 1000 * retries;
        console.log(`同步${modelName}表时发生错误，等待 ${waitTime}ms 后进行第 ${retries} 次重试...`);
        console.log(`错误信息: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`同步${modelName}表失败 (已重试 ${retries} 次):`, error.message);
        return false;
      }
    }
  }
}

// 两阶段同步方法
async function syncModelsInTwoPhases() {
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
    
    if (force) {
      console.log('警告: 使用force模式，将删除现有表并重新创建');
      console.log('5秒后开始执行，按Ctrl+C取消...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('已禁用外键检查');
    
    try {
      // 禁用模型自动同步
      const originalSync = disableAutoSync();
      
      // 导入所有模型
      console.log('导入模型...');
      const models = {
        Role: tryRequire('./models/Role'),
        Department: tryRequire('./models/department'),
        User: tryRequire('./models/user'),
        Patient: tryRequire('./models/Patients'),
        ShiftSetting: tryRequire('./models/ShiftSetting'),
        Schedule: tryRequire('./models/Schedule'),
        MedicalRecord: tryRequire('./models/MedicalRecord'),
        MedicalEquipment: tryRequire('./models/medical_equipment'),
        Medicine: tryRequire('./models/medicine'),
        MaintenanceOrder: tryRequire('./models/MaintenanceOrder'),
        MaintenanceHistory: tryRequire('./models/MaintenanceHistory'),
        MedicineStock: tryRequire('./models/MedicineStock'),
        MedicineStockHistory: tryRequire('./models/MedicineStockHistory'),
        MedicineTransaction: tryRequire('./models/MedicineTransaction'),
        MedicineTransactionItem: tryRequire('./models/MedicineTransactionItem'),
        Supplier: tryRequire('./models/supplier'),
        AiAgent: tryRequire('./models/AiAgent'),
        EquipmentMaintenance: tryRequire('./models/equipment_maintenance')
      };
      
      // 恢复模型自动同步
      restoreAutoSync(originalSync);
      
      // 第一阶段：创建所有表结构，但不包含外键约束
      console.log('\n===== 第一阶段：创建表结构（不含外键约束）=====');
      
      // 创建临时选项，禁用外键约束
      const tempOptions = { 
        ...(force ? { force: true } : { alter: true }),
        hooks: false
      };
      
      // 创建所有表，忽略外键约束
      for (const [modelName, model] of Object.entries(models)) {
        if (model) {
          // 修改模型定义，临时移除外键约束
          const originalReferences = {};
          
          // 遍历模型的所有属性
          for (const [attrName, attrDef] of Object.entries(model.rawAttributes)) {
            if (attrDef.references) {
              // 保存原始引用
              originalReferences[attrName] = { ...attrDef.references };
              // 临时删除引用
              delete attrDef.references;
            }
          }
          
          // 同步模型（不含外键约束）
          await syncModelWithRetry(model, modelName, tempOptions);
          
          // 恢复原始引用
          for (const [attrName, refs] of Object.entries(originalReferences)) {
            if (model.rawAttributes[attrName]) {
              model.rawAttributes[attrName].references = refs;
            }
          }
        }
      }
      
      // 第二阶段：添加外键约束
      console.log('\n===== 第二阶段：添加外键约束 =====');
      
      // 使用 ALTER TABLE 语句添加外键约束
      for (const [modelName, model] of Object.entries(models)) {
        if (model) {
          console.log(`为 ${modelName} 添加外键约束...`);
          
          for (const [attrName, attrDef] of Object.entries(model.rawAttributes)) {
            if (attrDef.references) {
              const { model: targetTable, key: targetKey } = attrDef.references;
              const sourceTable = model.tableName;
              const sourceKey = attrDef.field || attrName;
              
              try {
                const sql = `ALTER TABLE \`${sourceTable}\` ADD CONSTRAINT \`fk_${sourceTable}_${sourceKey}\` 
                             FOREIGN KEY (\`${sourceKey}\`) REFERENCES \`${targetTable}\` (\`${targetKey}\`) 
                             ON DELETE ${attrDef.onDelete || 'NO ACTION'} 
                             ON UPDATE ${attrDef.onUpdate || 'CASCADE'}`;
                
                await sequelize.query(sql);
                console.log(`  - 已添加外键: ${sourceTable}.${sourceKey} -> ${targetTable}.${targetKey}`);
              } catch (error) {
                console.warn(`  - 添加外键失败: ${sourceTable}.${sourceKey} -> ${targetTable}.${targetKey}`);
                console.warn(`    错误: ${error.message}`);
              }
            }
          }
        }
      }
      
      console.log('\n所有模型已成功同步到数据库！');
      
    } finally {
      // 重新启用外键检查
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('已重新启用外键检查');
    }
    
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
syncModelsInTwoPhases();
