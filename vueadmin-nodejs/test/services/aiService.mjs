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
  temperature: 0.,
});


// 定义提示模板
const template = `你是一个医学专家,请根据患者的过往病史，分析并预测疾病发展趋势。你的回答格式应该类似按照如下格式:{{"trend":"患者近期血压呈波动上升趋势，最近三次测量值分别为130/85、135/88、142/92。建议加强血压监测频率，注意控制饮食和作息。","medicationAdvice":"1. 建议继续服用当前降压药物方案；\n2. 可考虑适当调整服用时间，建议在早餐后服用；\n3. 如血压持续升高，可能需要调整剂量。","risks":[{{"level":"high","description":"血压持续升高风险"}},{{"level":"medium","description":"心血管并发症风险"}},{{"level":"low","description":"用药不良反应风险"}}]}}。患者的过往病史是：{question}`;

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