import mysql from 'mysql2/promise';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test'
};

/**
 * 执行SQL查询并导出结果到Excel文件
 * @param {string} sql SQL查询语句
 * @param {string} fileName 导出的文件名（不含扩展名）
 * @returns {Promise<string>} 导出文件的完整路径
 */
export async function exportQueryResultToExcel(sql, fileName) {
    try {
        // 创建数据库连接
        const connection = await mysql.createConnection(dbConfig);
        console.log('数据库连接成功');

        // 执行查询
        const [rows] = await connection.execute(sql);
        console.log(`查询到 ${rows.length} 条记录`);

        // 关闭数据库连接
        await connection.end();

        if (rows.length === 0) {
            throw new Error('没有查询到数据');
        }

        // 创建工作簿和工作表
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        // 生成文件名（添加时间戳防止重名）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fullFileName = `${fileName}_${timestamp}.xlsx`;
        const exportPath = path.join(__dirname, '../exports', fullFileName);

        // 写入文件
        XLSX.writeFile(wb, exportPath);
        console.log(`文件已导出到: ${exportPath}`);

        return exportPath;
    } catch (error) {
        console.error('导出Excel失败:', error);
        throw error;
    }
}

/**
 * 格式化日期时间
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/\//g, '-');
}
