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

async function checkTableStructure() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');

    // 检查maintenance_orders表结构
    const [columns] = await connection.execute(
      "SHOW FULL COLUMNS FROM maintenance_orders"
    );
    
    console.log('维修工单表字段列表:');
    columns.forEach(column => {
      console.log(`${column.Field}: ${column.Type} ${column.Null === 'YES' ? '可为空' : '不可为空'} ${column.Comment ? '- ' + column.Comment : ''}`);
    });
    
    // 检查外键约束
    const [foreignKeys] = await connection.execute(
      "SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_orders' AND REFERENCED_TABLE_NAME IS NOT NULL",
      [dbConfig.database]
    );
    
    console.log('\n维修工单表外键约束:');
    if (foreignKeys.length === 0) {
      console.log('没有找到外键约束');
    } else {
      foreignKeys.forEach(fk => {
        console.log(`${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} 引用 ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})`);
      });
    }

    // 关闭连接
    await connection.end();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('脚本执行错误:', error.message);
    process.exit(1);
  }
}

// 执行检查
checkTableStructure();
