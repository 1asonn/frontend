// 添加负责人ID字段到部门表的迁移脚本
const { sequelize } = require('../init.js');
const { QueryTypes } = require('sequelize');

async function runMigration() {
    try {
        // 检查连接
        await sequelize.authenticate();
        console.log('数据库连接已成功建立');

        // 检查字段是否已存在
        const checkColumnQuery = "SHOW COLUMNS FROM `departments` LIKE 'manager_id'";
        const columns = await sequelize.query(checkColumnQuery, { type: QueryTypes.SELECT });

        if (columns.length > 0) {
            console.log('manager_id字段已存在于departments表中');
        } else {
            // 添加manager_id字段
            const addColumnQuery = `
                ALTER TABLE departments 
                ADD COLUMN manager_id INT,
                ADD CONSTRAINT fk_department_manager 
                FOREIGN KEY (manager_id) 
                REFERENCES users(id) 
                ON DELETE SET NULL
                ON UPDATE CASCADE
            `;
            
            await sequelize.query(addColumnQuery);
            console.log('manager_id字段已成功添加到departments表中');
        }

        console.log('迁移完成');
    } catch (error) {
        console.error('迁移过程中发生错误:', error);
    } finally {
        // 关闭连接
        await sequelize.close();
    }
}

// 执行迁移
runMigration();
