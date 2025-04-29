const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'test',
  port: process.env.DB_PORT || 3306
};

async function addAssigneeIdColumn() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');

    // 检查字段是否已存在
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_orders' AND COLUMN_NAME = 'assignee_id'",
      [dbConfig.database]
    );

    if (columns.length > 0) {
      console.log('assignee_id字段已存在，无需添加');
    } else {
      // 添加assignee_id字段
      await connection.execute(
        "ALTER TABLE maintenance_orders ADD COLUMN assignee_id INT NULL COMMENT '处理人ID，关联users表' AFTER assignee"
      );
      console.log('成功添加assignee_id字段');

      // 添加外键约束
      await connection.execute(
        "ALTER TABLE maintenance_orders ADD CONSTRAINT maintenance_orders_assignee_id_foreign_idx FOREIGN KEY (assignee_id) REFERENCES users(id)"
      );
      console.log('成功添加外键约束');
    }

    // 关闭连接
    await connection.end();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('迁移脚本执行错误:', error.message);
    process.exit(1);
  }
}

// 执行迁移
addAssigneeIdColumn();
