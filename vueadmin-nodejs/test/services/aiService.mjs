import { OpenAI } from 'openai';
import NodeCache from 'node-cache';
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

// 定义分析结果缓存，设置1小时过期
const analysisCache = new NodeCache({ stdTTL: 3600 });

// 定义提示模板
const SYSTEM_PROMPT = `你是一位经验丰富的主治医师，请基于患者的就诊记录进行专业分析。请严格按照以下JSON格式输出，不要包含任何其他内容：

{
    "trend": "string // 患者病情发展趋势分析",
    "medicationAdvice": "string // 详细的用药建议",
    "risks": [
        {
            "level": "string // 必须是 high、medium 或 low",
            "description": "string // 风险描述",
            "suggestion": "string // 建议"
        }
    ],
    "lifestyle": {
        "diet": "string // 饮食建议",
        "exercise": "string // 运动建议",
        "monitoring": "string // 监测指标"
    }
}`;

// 定义报表生成提示模板
const REPORT_PROMPT = `你是一位专业的数据分析师，请根据提供的数据生成详细的分析报告。请严格按照以下JSON格式输出：

{
    "title": "string // 报表标题",
    "summary": "string // 数据总体概述",
    "metrics": [
        {
            "name": "string // 指标名称",
            "value": "string // 指标值",
            "trend": "string // 变化趋势: up/down/stable",
            "analysis": "string // 指标分析"
        }
    ],
    "insights": [
        {
            "title": "string // 洞察标题",
            "description": "string // 洞察描述",
            "importance": "string // high/medium/low",
            "recommendation": "string // 建议"
        }
    ],
    "visualization": {
        "recommended": ["string // 建议的可视化类型，如 line_chart, bar_chart, pie_chart 等"],
        "explanation": "string // 为什么推荐这些可视化方式"
    }
}`;

const client = new OpenAI({
    baseURL: "https://api.stepfun.com/v1",
    apiKey: process.env.STEPFUN_API_KEY || "4U6PWmOxJJpPjf56zZ0I22P7EKKnWzO9qvCrfTpxStmYntIllBCQ5hHALi6EOmCIB"
});

// 重试机制
const retryOperation = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
};

export const getJsonReply = async (records) => {
    try {
        // 生成缓存键
        const cacheKey = JSON.stringify(records.map(r => ({
            date: r.date,
            diagnosticResults: r.diagnosticResults
        })));

        // 检查缓存
        const cachedResult = analysisCache.get(cacheKey);
        if (cachedResult) {
            console.log('返回缓存的分析结果');
            return cachedResult;
        }

        // 使用重试机制调用 API
        const response = await retryOperation(async () => {
            const completion = await client.chat.completions.create({
                model: "step-1-32k",
                messages: [
                    { 
                        role: "system", 
                        content: SYSTEM_PROMPT 
                    },
                    { 
                        role: "user", 
                        content: `请分析以下患者的就诊记录并生成JSON格式的分析报告。这位患者从${records[0].date}到${records[records.length-1].date}共就诊${records.length}次，具体记录如下：\n${JSON.stringify(records, null, 2)}\n注意：请严格按照规定的JSON格式输出，不要包含任何其他内容。` 
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
                response_format: { type: "json_object" }
            });
            return completion;
        });

        // 解析并验证响应
        let result;
        try {
            const content = response.choices[0].message.content;
            result = JSON.parse(content);
            
            // 验证必要字段
            if (!result.trend || !result.medicationAdvice || !Array.isArray(result.risks)) {
                throw new Error('AI响应格式不正确');
            }

            // 验证风险级别
            const validLevels = ['high', 'medium', 'low'];
            const hasInvalidRisk = result.risks.some(risk => !validLevels.includes(risk.level));
            if (hasInvalidRisk) {
                throw new Error('风险级别不正确');
            }
        } catch (error) {
            console.error('AI响应解析失败:', error);
            throw new Error('AI响应格式不正确');
        }

        // 缓存结果
        analysisCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('AI分析失败:', error);
        throw new Error('AI分析服务暂时不可用，请稍后重试');
    }
};

// 生成数据报表
export const generateReport = async (data, requirements = {}) => {
    try {
        // 生成缓存键
        const cacheKey = JSON.stringify({
            data: data,
            requirements: requirements
        });

        // 检查缓存
        const cachedResult = analysisCache.get(cacheKey);
        if (cachedResult) {
            console.log('返回缓存的报表结果');
            return cachedResult;
        }

        // 准备提示词
        let prompt = `请分析以下数据并生成报表。\n\n数据内容：\n${JSON.stringify(data, null, 2)}\n\n`;
        
        // 添加特定要求
        if (requirements.focus) {
            prompt += `\n重点关注：${requirements.focus}`;
        }
        if (requirements.timeRange) {
            prompt += `\n时间范围：${requirements.timeRange}`;
        }
        if (requirements.metrics) {
            prompt += `\n需要分析的指标：${requirements.metrics.join(', ')}`;
        }
        if (requirements.visualizationPreference) {
            prompt += `\n可视化偏好：${requirements.visualizationPreference}`;
        }

        // 使用重试机制调用 API
        const response = await retryOperation(async () => {
            const completion = await client.chat.completions.create({
                model: "step-1-32k",
                messages: [
                    {
                        role: "system",
                        content: REPORT_PROMPT
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
                response_format: { type: "json_object" }
            });
            return completion;
        });

        // 解析并验证响应
        let result;
        try {
            const content = response.choices[0].message.content;
            result = JSON.parse(content);

            // 验证必要字段
            if (!result.title || !result.summary || !Array.isArray(result.metrics) || !Array.isArray(result.insights)) {
                throw new Error('AI响应格式不正确');
            }

            // 验证指标和洞察
            const validTrends = ['up', 'down', 'stable'];
            const validImportance = ['high', 'medium', 'low'];

            const hasInvalidMetric = result.metrics.some(metric => !metric.name || !metric.value || !validTrends.includes(metric.trend));
            if (hasInvalidMetric) {
                throw new Error('指标格式不正确');
            }

            const hasInvalidInsight = result.insights.some(insight => !insight.title || !insight.description || !validImportance.includes(insight.importance));
            if (hasInvalidInsight) {
                throw new Error('洞察格式不正确');
            }
        } catch (error) {
            console.error('AI响应解析失败:', error);
            throw new Error('AI响应格式不正确');
        }

        // 缓存结果
        analysisCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('报表生成失败:', error);
        throw new Error('报表生成服务暂时不可用，请稍后重试');
    }
};

// 导出缓存清理函数，用于管理缓存
export const clearAnalysisCache = () => {
    analysisCache.flushAll();
    console.log('分析缓存已清除');
};