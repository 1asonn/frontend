import { ChatOpenAI }  from '@langchain/openai'
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents/toolkits/sql";
import { DataSource } from "typeorm";
import { exportQueryResultToExcel } from './utils/exportToExcel.mjs';

const llm = new ChatOpenAI({
  openAIApiKey: "4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB",
  configuration: {
    baseURL: "https://api.stepfun.com/v1", // 自定义 API 端点
  },
  modelName: "step-1v-32k", // 模型名称
  temperature: 0.7,
});

  // connect to database
  const datasource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
    database: "test",
    synchronize: true,
  });

export const run = async () => {

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });
  
  const toolkit = new SqlToolkit(db, llm);
  const executor = createSqlAgent(llm, toolkit);

  const input = `查询id为1的患者的所有就诊记录信息`;

  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({ input });

  console.log(`Got output ${JSON.stringify(result)}`);

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  );
  
  // 从intermediateSteps中查找query-sql工具的调用
  const querySqlStep = result.intermediateSteps.find(
    step => step.action.tool === 'query-sql'
  );

  if (!querySqlStep) {
    throw new Error('未找到SQL查询步骤');
  }

  const sql = querySqlStep.action.toolInput;
  console.log('提取的SQL语句:', sql);

  // 导出查询结果到Excel
  try {
    const exportPath = await exportQueryResultToExcel(sql, 'patient_record_report');
    console.log('导出成功，文件路径:', exportPath);
  } catch (error) {
    console.error('导出失败:', error);
  }

  await datasource.destroy();
  return 
};

run()