const { sequelize } = require('./init.js');

async function addFields() {
  try {
    console.log("开始添加字段...");
    
    const fields = [
      {
        name: 'phone',
        sql: "ALTER TABLE users ADD COLUMN phone VARCHAR(255) NULL UNIQUE COMMENT '手机号码';"
      },
      {
        name: 'identity',
        sql: "ALTER TABLE users ADD COLUMN identity VARCHAR(255) NULL COMMENT '身份证号码';"
      },
      {
        name: 'gender',
        sql: "ALTER TABLE users ADD COLUMN gender VARCHAR(255) NULL COMMENT '性别';"
      },
      {
        name: 'birth_date',
        sql: "ALTER TABLE users ADD COLUMN birth_date DATETIME NULL COMMENT '出生日期';"
      },
      {
        name: 'address',
        sql: "ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL COMMENT '住址';"
      }
    ];

    for (const field of fields) {
      try {
        await sequelize.query(field.sql);
        console.log(`成功添加${field.name}字段`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`字段${field.name}已存在，跳过`);
        } else {
          console.error(`添加${field.name}字段时出错:`, error.message);
        }
      }
    }

    console.log("字段添加过程完成！");
  } catch (error) {
    console.error("添加字段时出错:", error.message);
  } finally {
    // 关闭数据库连接
    try {
      await sequelize.close();
      console.log("数据库连接已关闭");
    } catch (error) {
      console.error("关闭数据库连接时出错:", error.message);
    }
  }
}

// 执行函数
addFields(); 