const sqlAgentService = require('./services/sqlAgentService');
const util = require('util');

// 用于记录和显示SQL代理的中间步骤
class SqlDebugger {
  constructor() {
    this.steps = [];
  }

  addStep(type, content) {
    this.steps.push({
      stepNumber: this.steps.length + 1,
      type,
      content,
      timestamp: new Date().toISOString()
    });
  }

  printSteps() {
    console.log('\n====== SQL代理执行过程 ======\n');
    this.steps.forEach(step => {
      console.log(`步骤 ${step.stepNumber} [${step.type}] - ${step.timestamp}`);
      console.log('-'.repeat(80));
      
      if (typeof step.content === 'object') {
        if (step.type === 'SQL代理响应') {
          // 详细展示SQL代理响应的各个部分
          console.log('● 原始查询:', step.content.query);
          console.log('● 生成的SQL:', step.content.sql);
          console.log('● 查询结果行数:', step.content.rowCount || 0);
          console.log('● 查询结果样例:');
          
          if (step.content.data && step.content.data.length > 0) {
            // 只显示前3条记录作为样例
            const sampleData = step.content.data.slice(0, 3);
            console.log(util.inspect(sampleData, { depth: 2, colors: true }));
            if (step.content.data.length > 3) {
              console.log(`... 还有 ${step.content.data.length - 3} 条记录 ...`);
            }
          } else {
            console.log('无数据返回');
          }
          
          // 展示中间步骤
          if (step.content.intermediateSteps && step.content.intermediateSteps.length > 0) {
            console.log('\n● 代理思考过程:');
            step.content.intermediateSteps.forEach((intermediateStep, index) => {
              console.log(`  步骤 ${index + 1}: ${intermediateStep.action.tool || '思考'}`);
              if (intermediateStep.action.log) {
                console.log('  思考内容:\n', intermediateStep.action.log);
              }
              if (intermediateStep.action.toolInput) {
                console.log('  工具输入:\n', intermediateStep.action.toolInput);
              }
              console.log('  工具输出:\n', intermediateStep.observation);
              console.log('  ' + '-'.repeat(60));
            });
          }
        } else if (step.type === 'SQL执行错误') {
          // 详细展示SQL错误
          console.log('● 错误类型:', step.content.name || '未知错误');
          console.log('● 错误消息:', step.content.message);
          if (step.content.sql) {
            console.log('● 导致错误的SQL:', step.content.sql);
          }
          if (step.content.code) {
            console.log('● 错误代码:', step.content.code);
          }
          if (step.content.stack) {
            console.log('● 错误堆栈:\n', step.content.stack.split('\n').slice(0, 3).join('\n'));
          }
        } else {
          // 其他对象类型
          console.log(util.inspect(step.content, { depth: null, colors: true }));
        }
      } else {
        // 字符串类型
        console.log(step.content);
      }
      console.log('='.repeat(80) + '\n');
    });
  }
}

// 测试函数
async function testSqlAgent() {
  const logger = new SqlDebugger();
  
  try {
    // 初始化SQL代理
    logger.addStep('初始化', '开始初始化SQL代理服务');
    await sqlAgentService.initialize();
    logger.addStep('初始化', 'SQL代理服务初始化完成');
    
    // 测试查询1: 简单的排班查询
    const query1 = "查询最近30天内的所有维修工单";
    logger.addStep('用户查询', query1);
    
    try {
      const result1 = await sqlAgentService.executeQuery(query1);
      logger.addStep('SQL代理响应', result1);
    } catch (error) {
      logger.addStep('SQL执行错误', error);
    }
    
    // 测试查询2: 带有不存在字段的查询
    const query2 = "查询当前正在工作的职工和他们的具体上班时间";
    logger.addStep('用户查询', query2);
    
    try {
      const result2 = await sqlAgentService.executeQuery(query2);
      logger.addStep('SQL代理响应', result2);
    } catch (error) {
      logger.addStep('SQL执行错误', error);
    }
    
    // 测试查询3: 复杂关联查询
    const query3 = "统计每个部门的职工排班情况，计算每种班次的人数";
    logger.addStep('用户查询', query3);
    
    try {
      const result3 = await sqlAgentService.executeQuery(query3);
      logger.addStep('SQL代理响应', result3);
    } catch (error) {
      logger.addStep('SQL执行错误', error);
    }
    
  } catch (error) {
    logger.addStep('程序错误', error);
  } finally {
    // 打印所有步骤
    logger.printSteps();
  }
}

// 运行测试
console.log('开始SQL代理测试...');
testSqlAgent().then(() => {
  console.log('SQL代理测试完成');
}).catch(err => {
  console.error('测试过程中发生错误:', err);
});