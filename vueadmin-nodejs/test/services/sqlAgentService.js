const { ChatOpenAI } = require('@langchain/openai');
const { SqlDatabase } = require("langchain/sql_db");
const { createSqlAgent, SqlToolkit } = require("langchain/agents/toolkits/sql");
const { DataSource } = require("typeorm");
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

// 创建LLM实例
const llm = new ChatOpenAI({
  openAIApiKey: process.env.API_KEY || "4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB",
  configuration: {
    baseURL: process.env.BASE_URL || "https://api.stepfun.com/v1", // 自定义 API 端点
  },
  modelName: "step-1v-32k", // 模型名称
  temperature: 0.7,
});

// 数据库连接配置
const datasource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "test",
  synchronize: true,
});

// 导出查询结果到Excel
async function exportQueryResultToExcel(sql, fileName) {
  try {
    // 确保数据库连接已初始化
    if (!datasource.isInitialized) {
      await datasource.initialize();
    }
    
    // 执行SQL查询
    const result = await datasource.query(sql);
    
    if (!result || result.length === 0) {
      return { success: false, message: '查询结果为空' };
    }
    
    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('查询结果');
    
    // 添加表头
    const headers = Object.keys(result[0]);
    worksheet.addRow(headers);
    
    // 添加数据行
    result.forEach(row => {
      worksheet.addRow(Object.values(row));
    });
    
    // 设置列宽
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // 确保uploads目录存在
    const uploadsDir = path.join(__dirname, '../uploads');
    const reportsDir = path.join(uploadsDir, 'reports');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFileName = `${fileName || 'sql_report'}_${timestamp}.xlsx`;
    const outputPath = path.join(reportsDir, outputFileName);
    
    // 保存文件
    await workbook.xlsx.writeFile(outputPath);
    
    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      downloadUrl: `/uploads/reports/${outputFileName}`
    };
  } catch (error) {
    console.error('导出Excel失败:', error);
    return { success: false, message: error.message };
  }
}

class SqlAgentService {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.toolkit = null;
    this.executor = null;
  }
  
  /**
   * 初始化SQL Agent
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // 初始化数据库连接
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }
      
      // 创建SQL数据库实例
      this.db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        includesTables: ['maintenance_orders', 'medical_equipment', 'equipment_maintenance', 'maintenance_history', 'users', 'departments'],
        sampleRowsInTableInfo: 3
      });
      
      // 创建SQL工具包和执行器
      this.toolkit = new SqlToolkit(this.db, llm);
      
      // 创建SQL Agent并提供MySQL特定的指导
      const mysqlGuidance = `
      使用MySQL语法执行所有查询。特别是日期函数，请使用MySQL特定的语法：
      - 当前日期: CURDATE() 或 CURRENT_DATE()
      - 当前时间戳: NOW() 或 CURRENT_TIMESTAMP()
      - 日期加减: DATE_ADD(date, INTERVAL value unit) 或 DATE_SUB(date, INTERVAL value unit)
      - 例如，30天前的日期: DATE_SUB(NOW(), INTERVAL 30 DAY)
      - 不要使用SQLite的datetime()函数
      `;
      
      this.executor = createSqlAgent(llm, this.toolkit, { prefix: mysqlGuidance });
      
      this.initialized = true;
      console.log('SQL Agent 服务初始化成功');
    } catch (error) {
      console.error('SQL Agent 服务初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 执行自然语言查询
   * @param {string} query - 自然语言查询
   * @param {boolean} exportToExcel - 是否导出到Excel
   * @param {string} fileName - 导出文件名
   * @returns {Object} 查询结果
   */
  async executeQuery(query, exportToExcel = false, fileName = '') {
    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.initialize();
      }
      
      // 添加MySQL语法提示到查询中
      const enhancedQuery = `${query}\n请使用MySQL语法，特别是日期函数。例如，使用DATE_SUB(NOW(), INTERVAL 30 DAY)来表示30天前的日期，而不是使用SQLite的datetime('now', '-30 days')函数。`;
      
      console.log(`执行查询: "${enhancedQuery}"...`);
      
      // 执行查询
      const result = await this.executor.call({ input: enhancedQuery });
      
      console.log(`Got output ${JSON.stringify(result)}`);
      // 从intermediateSteps中查找query-sql工具的调用
      const querySqlStep = result.intermediateSteps.find(
        step => step.action.tool === 'query-sql'
      );
      
      if (!querySqlStep) {
        return {
          success: false,
          message: '未找到SQL查询步骤',
          result: result.output
        };
      }
      
      // 提取SQL语句
      const sql = querySqlStep.action.toolInput;
      console.log('提取的SQL语句:', sql);
      
      // 执行SQL查询获取实际结果
      let queryResult = [];
      try {
        // 确保数据库连接已初始化
        if (!datasource.isInitialized) {
          await datasource.initialize();
        }
        
        // 执行SQL查询
        queryResult = await datasource.query(sql);
        console.log(`查询结果: ${queryResult.length} 条记录`);
      } catch (sqlError) {
        console.error('SQL查询执行失败:', sqlError);
        return {
          success: false,
          query: query,
          sql: sql,
          message: `SQL查询执行失败: ${sqlError.message}`,
          result: result.output,
          error: sqlError
        };
      }
      
      // 如果需要导出到Excel
      let exportResult = null;
      if (exportToExcel) {
        exportResult = await exportQueryResultToExcel(sql, fileName);
      }
      
      return {
        success: true,
        query: query,
        sql: sql,
        result: result.output,
        data: queryResult, // 添加实际查询结果
        rowCount: queryResult.length,
        exportResult: exportResult,
        intermediateSteps: result.intermediateSteps
      };
    } catch (error) {
      console.error('执行查询失败:', error);
      return {
        success: false,
        message: `执行查询失败: ${error.message}`,
        error: error
      };
    }
  }
  
  /**
   * 关闭数据库连接
   */
  async close() {
    if (datasource.isInitialized) {
      await datasource.destroy();
      console.log('数据库连接已关闭');
    }
    this.initialized = false;
  }
}

// 导出单例实例
module.exports = new SqlAgentService();
