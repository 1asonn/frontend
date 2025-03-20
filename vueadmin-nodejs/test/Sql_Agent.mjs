import {ChatOpenAI}  from '@langchain/openai'
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent } from "langchain/agents/toolkits/sql";
import { SqlToolkit } from "langchain/agents/toolkits/sql";
import { DataSource } from "typeorm";
import { analyze } from "./services/aiService.mjs"


const llm = new ChatOpenAI({
  openAIApiKey: "4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB",
  configuration: {
    baseURL: "https://api.stepfun.com/v1", // 自定义 API 端点
  },
  modelName: "step-1v-32k", // 模型名称
  temperature: 0.7,
});

export const run = async () => {

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

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
  });
  // const model = new OpenAI({ temperature: 0 });
  const toolkit = new SqlToolkit(db, llm);
  const executor = createSqlAgent(llm, toolkit);

  const input = `查询id为1的患者的所有就诊记录信息`;

  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({ input });

  console.log(`Got output ${result.output}`);

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2
    )}`
  );
  
  const res = await analyze(result.output)
  console.log("ai analysis",res)
  await datasource.destroy();
  return 
};

run()
// import { ChatOpenAI } from "@langchain/openai";
// import { PromptTemplate } from "@langchain/core/prompts";
// import { LLMChain } from "langchain/chains";
// import * as dotenv from "dotenv";

// // 加载环境变量
// dotenv.config();

// // 创建模型实例
// const llm = new ChatOpenAI({
//   openAIApiKey: "4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB",
//   configuration: {
//     baseURL: "https://api.stepfun.com/v1", // 自定义 API 端点
//   },
//   modelName: "step-1v-8k", // 模型名称
//   temperature: 0.7,
// });

// // 定义提示模板
// const template = `你是阶跃星辰大模型开发的智能助手，你会根据用户的问题，一步一步的思考并回答。用户的问题是：问题：{question}`;

// const prompt = new PromptTemplate({
//   template,
//   inputVariables: ["question"],
// });

// // 创建链式处理器
// const chain = new LLMChain({
//   llm,
//   prompt,
// });

// // 异步执行查询
// const run = async (question) => {
//   try {
//     const response = await chain.call({
//       question: question,
//     });
//     return response.text;
//   } catch (error) {
//     console.error("请求失败:", error);
//     return "服务暂时不可用";
//   }
// };

// // 执行示例
// const question = "阶跃星辰大模型如何帮助企业员工提升效率";

// run(question)
//   .then(console.log)
//   .catch(console.error);