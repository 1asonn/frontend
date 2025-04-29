const ExcelJS = require('exceljs');

/**
 * 创建Excel文件并写入数据
 * @param {Array} data 要写入的数据数组
 * @param {Array} columns 列定义，格式为[{header: '列标题', key: '数据键名', width: 列宽}]
 * @param {String} filePath 文件保存路径
 * @returns {Promise} 返回Promise
 */
const createExcelFile = async (data, columns, filePath) => {
    try {
        // 创建工作簿
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('数据');
        
        // 设置列
        worksheet.columns = columns;
        
        // 添加数据行
        worksheet.addRows(data);
        
        // 设置表头样式
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // 写入文件
        await workbook.xlsx.writeFile(filePath);
        
        return filePath;
    } catch (error) {
        throw new Error(`创建Excel文件失败: ${error.message}`);
    }
};

module.exports = {
    createExcelFile
};
