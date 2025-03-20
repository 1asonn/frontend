import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 创建模型实例
const llm = new ChatOpenAI({
  openAIApiKey: "4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB",
  configuration: {
    baseURL: "https://api.stepfun.com/v1", // 自定义 API 端点
  },
  modelName: "step-1v-32k", // 模型名称
  temperature: 0.7,
});

// 定义提示模板
const template = `你是一个归纳总结专家,你会用户输入的信息，合并特征相同的信息并输出一个markdown格式的总结。用户的输入是：{question}`;

const prompt = new PromptTemplate({
  template,
  inputVariables: ["question"],
});

// 创建链式处理器
const chain = new LLMChain({
  llm,
  prompt,
});

// 异步执行查询
export const analyze = async (question) => {
  try {
    const response = await chain.call({
      question: question,
    });
    return response.text;
  } catch (error) {
    console.error("请求失败:", error);
    return "服务暂时不可用";
  }
};