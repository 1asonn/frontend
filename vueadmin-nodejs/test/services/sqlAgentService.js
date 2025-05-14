const { ChatOpenAI } = require('@langchain/openai');
const { SqlDatabase } = require("langchain/sql_db");
const { createSqlAgent, SqlToolkit } = require("langchain/agents/toolkits/sql");
const { DataSource } = require("typeorm");
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const cosService = require('./cosService');
const { v4: uuidv4 } = require('uuid');

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

// 导出查询结果到Excel并上传到腾讯云COS
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
    const sqlReportsDir = path.join(reportsDir, 'sql-reports');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    if (!fs.existsSync(sqlReportsDir)) {
      fs.mkdirSync(sqlReportsDir, { recursive: true });
    }
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = uuidv4().substring(0, 8);
    const safeFileName = (fileName || 'sql_report').replace(/[^a-zA-Z0-9_-]/g, '_');
    const outputFileName = `${safeFileName}_${timestamp}_${uniqueId}.xlsx`;
    const outputPath = path.join(sqlReportsDir, outputFileName);
    
    // 保存文件
    await workbook.xlsx.writeFile(outputPath);
    
    // 读取文件
    const fileBuffer = fs.readFileSync(outputPath);
    
    // 在COS中的存储路径
    const cosKey = `reports/sql-reports/${outputFileName}`;
    
    // 上传到腾讯云COS
    const uploadResult = await cosService.uploadFile({
      file: outputPath,
      key: cosKey
    });
    
    if (!uploadResult.success) {
      throw new Error(`上传到腾讯云COS失败: ${uploadResult.error}`);
    }
    
    // 获取临时访问链接(3天有效期)
    const urlResult = await cosService.getFileUrl({
      key: cosKey,
      expires: 259200 // 3天 = 3*24*60*60秒
    });
    
    if (!urlResult.success) {
      throw new Error(`获取文件访问链接失败: ${urlResult.error}`);
    }
    
    return {
      success: true,
      filePath: outputPath,
      fileName: outputFileName,
      localUrl: `/uploads/reports/sql-reports/${outputFileName}`,
      downloadUrl: urlResult.url,  // COS临时下载链接
      cosUrl: uploadResult.url,    // COS原始URL
      cosKey: cosKey               // COS中的对象Key
    };
  } catch (error) {
    console.error('导出Excel并上传到腾讯云COS失败:', error);
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
        includesTables: ['maintenance_orders', 'medical_equipment', 'equipment_maintenance', 'users', 'departments','patients','roles','suppliers','schedules','shift_settings','medicines'],
        excludeColumns: [
          { table: 'users', column: 'password' }
        ],
        sampleRowsInTableInfo: 5
      });
      
      // 创建SQL工具包和执行器
      this.toolkit = new SqlToolkit(this.db, llm);
      
      // 创建SQL Agent并提供MySQL特定的指导
      const mysqlGuidance = `
      使用MySQL语法执行所有查询。特别是日期函数，请使用MySQL特定的语法
      
      非常重要：在生成SQL语句前，请先使用info-sql工具获取相关表的结构信息，确保使用的字段确实存在。如果查询失败并提示"Unknown column"，请立即查看表结构并修正查询。
      
      职工信息查询指南:
      - 职工信息存储在users表中
      - 可以通过role_id字段关联roles表来识别职工的角色
      - 也可以通过department_id字段关联departments表来识别职工所在科室

      重要表结构信息：
      1. equipment_maintenance表的关键字段：
         - id: 主键
         - equipment_id: 关联medical_equipment表的id
         - maintenance_order_id: 关联maintenance_orders表的id（不是order_id）
         - maintenance_type: 维护类型（repair/preventive/calibration）
         - start_date: 维护开始日期（不是date或maintenance_date）
         - end_date: 维护结束日期 
         - fault_description: 故障描述
         - maintance_details: 修复内容
         - remark: 修复备注
         - operator: 操作人
         - next_maintenance_date: 下次维护日期
         - total_cost: 维护费用
      
      2. maintenance_orders表的关键字段：
         - id: 主键
         - order_number: 工单编号
         - equipment_id: 关联medical_equipment表的id
         - equipment_name: 设备名称
         - fault_description: 故障描述
         - create_time: 创建时间（不是order_date）
         - process_time: 处理时间
         - complete_time: 完成时间
      
      3. medical_equipment表的关键字段：
         - id: 主键
         - equipment_code: 设备编码
         - name: 设备名称
         - model: 设备型号
         - department: 所属部门
         - status: 状态（normal/maintenance/scrapped）
         - purchase_date: 采购日期
         - next_maintenance_date: 下次维护日期

      4. roles表的关键字段：
          - role_name: 角色名称
          - description: 角色职责
          - authoritys: 角色权限

      
      表关系说明：
      - departments表的id字段是主键，对应其他表中的department_id外键
      - users表的id字段是主键，对应其他表中的user_id、created_by、reporter_id、assignee_id、employee_id等外键,realname是职工姓名,username是职工的账号
      - medical_equipment表的id字段是主键，对应maintenance_orders表和equipment_maintenance表中的equipment_id外键
      - roles表的id字段是主键，对应users表中的role_id外键
      - shift_settings表的id字段是主键，表中存储班次名称(name)、开始时间(startTime)和结束时间(endTime)
      - schedules表中的星期字段(monday、tuesday、wednesday、thursday、friday、saturday、sunday)存储的是shift_settings表中的id值，但这些字段可能为NULL，表示该天没有排班
      - 查询排班信息时，需要使用LEFT JOIN关联schedules和shift_settings表，以确保即使某天没有排班(对应字段为NULL)的情况下也能返回结果
      - schedules表的employee_id字段是职工id

      排班查询示例:
        SELECT 
            u.realname AS 职工姓名,
            d.name AS 部门名称,
            mon.name AS 周一班次,
            mon.startTime AS 周一开始时间,
            mon.endTime AS 周一结束时间,
            tue.name AS 周二班次
            -- 其他星期类似
        FROM 
            schedules s
        JOIN 
            users u ON s.employee_id = u.id
        JOIN 
            departments d ON s.department_id = d.id
        LEFT JOIN 
            shift_settings mon ON s.monday = mon.id
        LEFT JOIN 
            shift_settings tue ON s.tuesday = tue.id
        -- 其他星期的LEFT JOIN
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
      const enhancedQuery = `${query}\n请使用MySQL语法，特别是日期函数。例如，使用DATE_SUB(NOW(), INTERVAL 30 DAY)来表示30天前的日期，而不是使用SQLite的datetime('now', '-30 days')函数`;
      
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
