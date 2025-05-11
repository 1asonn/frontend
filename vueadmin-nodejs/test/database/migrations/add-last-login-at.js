const { sequelize } = require('../init.js');

// 手动添加last_login_at字段到users表
async function addLastLoginAtColumn() {
  try {
    // 检查字段是否已存在
    const [results] = await sequelize.query(
      "SHOW COLUMNS FROM `users` LIKE 'last_login_at'"
    );
    
    if (results.length === 0) {
      // 字段不存在，添加它
      await sequelize.query(
        "ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME COMMENT '最后登录时间'"
      );
      console.log("成功添加last_login_at字段到users表");
    } else {
      console.log("last_login_at字段已存在于users表中");
    }
  } catch (error) {
    console.error("添加last_login_at字段时出错:", error);
  }
}

// 执行迁移
addLastLoginAtColumn()
  .then(() => {
    console.log("迁移完成");
    process.exit(0);
  })
  .catch(err => {
    console.error("迁移失败:", err);
    process.exit(1);
  });
