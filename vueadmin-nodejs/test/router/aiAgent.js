const express = require('express');
const router = express.Router();
const AiAgent = require('../database/models/AiAgent');
const { CozeAPI } = require('@coze/api');

const apiClient = new CozeAPI({
  token: 'pat_i0V2sT3gNbuYKJwH7kC8Tcyk5opRN71oeYj8ISrW4N5PzymaE2aTtUJo2vxaKRyL',
  baseURL: 'https://api.coze.cn'
});


// const {analyze} = require('../services/aiService');
// import {analyze} from '../services/aiService.mjs'
let getJsonReply;
let generateReport;
(async () => {
    try {
        const aiService = await import('../services/aiService.mjs');
        getJsonReply = aiService.getJsonReply;
        generateReport = aiService.generateReport;
    } catch (error) {
        console.error('Failed to load aiService:', error);
    }
})();

//Ai病史分析
router.post('/MedicalAnalyze', async (req, res) => {
    try {
        const { record } = req.body;
        
        // 验证输入
        if (!Array.isArray(record)) {
            return res.status(400).json({
                code: 400,
                message: '病历记录格式不正确，应为数组'
            });
        }

        if (record.length === 0) {
            return res.status(400).json({
                code: 400,
                message: '病历记录不能为空'
            });
        }

        // 调用AI分析服务
        const response = await getJsonReply(record);
        
        res.status(200).json({
            code: 200,
            data: response
        });
    } catch (error) {
        console.error('AI分析失败:', error);
        res.status(500).json({
            code: 500,
            message: error.message || 'AI分析服务暂时不可用'
        });
    }
})

//Ai数据报表分析
router.post('/DataAnalyze', async (req, res) => {
    console.log("this is apiClient",apiClient)
    try {
        console.log('开始运行工作流...');
        
        // 直接使用流式API
        const stream = await apiClient.workflows.runs.stream({
          workflow_id: '7486457220134338610',
          parameters: {
            "excel": "https://p3-bot-workflow-sign.byteimg.com/tos-cn-i-mdko3gqilj/9de53c3fa0e84c11aefca1551b85fd73.xlsx~tplv-mdko3gqilj-image.image?rk3s=81d4c505&x-expires=1774193770&x-signature=W81HOV97xUvpgHg3nrmyKhz4JQY%3D&x-wf-file_name=%E6%88%B4%E5%B8%88%E5%85%84%E6%95%B0%E6%8D%AE%E5%88%86%E6%9E%90%E5%90%AF%E8%92%99%E8%AF%BE_Excel%E7%BB%83%E4%B9%A0.xlsx"
          }
        });
    
        // 处理流式响应
        for await (const chunk of stream) {
            console.log("this is chunk",chunk);
          if (typeof chunk === 'string') {
            try {
              const message = JSON.parse(chunk);
              console.log('收到消息:', message);
            } catch (error) {
              console.log('原始消息:', chunk);
            }
          } else {
            console.log('收到非字符串消息:', chunk);
          }
        }
    
        console.log('工作流执行结束');
      } catch (error) {
        console.error('工作流执行出错:', error);
        throw error;
      }
})
    
// // 创建新的AI Agent
// router.post('/agents', async (req, res) => {
//     try {
//         const agent = await AiAgent.create(req.body);
//         res.status(201).json(agent);
//     } catch (error) {
//         console.error('Error creating AI agent:', error);
//         res.status(500).json({ message: 'Error creating AI agent', error: error.message });
//     }
// });

// // 获取所有AI Agents
// router.get('/agents', async (req, res) => {
//     try {
//         const agents = await AiAgent.findAll();
//         res.json(agents);
//     } catch (error) {
//         console.error('Error fetching AI agents:', error);
//         res.status(500).json({ message: 'Error fetching AI agents', error: error.message });
//     }
// });

// // 获取特定AI Agent
// router.get('/agents/:id', async (req, res) => {
//     try {
//         const agent = await AiAgent.findByPk(req.params.id);
//         if (!agent) {
//             return res.status(404).json({ message: 'AI agent not found' });
//         }
//         res.json(agent);
//     } catch (error) {
//         console.error('Error fetching AI agent:', error);
//         res.status(500).json({ message: 'Error fetching AI agent', error: error.message });
//     }
// });

// // 更新AI Agent
// router.put('/agents/:id', async (req, res) => {
//     try {
//         const agent = await AiAgent.findByPk(req.params.id);
//         if (!agent) {
//             return res.status(404).json({ message: 'AI agent not found' });
//         }
//         await agent.update(req.body);
//         res.json(agent);
//     } catch (error) {
//         console.error('Error updating AI agent:', error);
//         res.status(500).json({ message: 'Error updating AI agent', error: error.message });
//     }
// });

// // 删除AI Agent
// router.delete('/agents/:id', async (req, res) => {
//     try {
//         const agent = await AiAgent.findByPk(req.params.id);
//         if (!agent) {
//             return res.status(404).json({ message: 'AI agent not found' });
//         }
//         await agent.destroy();
//         res.status(204).send();
//     } catch (error) {
//         console.error('Error deleting AI agent:', error);
//         res.status(500).json({ message: 'Error deleting AI agent', error: error.message });
//     }
// });

// // 使用AI Agent生成回复
// router.post('/agents/:id/chat', async (req, res) => {
//     try {
//         const agent = await AiAgent.findByPk(req.params.id);
//         if (!agent) {
//             return res.status(404).json({ message: 'AI agent not found' });
//         }

//         if (!agent.active) {
//             return res.status(400).json({ message: 'This AI agent is currently inactive' });
//         }

//         const prompt = {
//             systemPrompt: agent.prompt,
//             userPrompt: req.body.message
//         };

//         const options = {
//             model: agent.model,
//             temperature: agent.temperature,
//             max_tokens: agent.maxTokens
//         };

//         const response = await aiService.generateResponse(prompt, options);
//         res.json({ response });
//     } catch (error) {
//         console.error('Error generating AI response:', error);
//         res.status(500).json({ message: 'Error generating AI response', error: error.message });
//     }
// });

// // 使用AI Agent生成流式回复
// router.post('/agents/:id/chat/stream', async (req, res) => {
//     try {
//         const agent = await AiAgent.findByPk(req.params.id);
//         if (!agent) {
//             return res.status(404).json({ message: 'AI agent not found' });
//         }

//         if (!agent.active) {
//             return res.status(400).json({ message: 'This AI agent is currently inactive' });
//         }

//         const prompt = {
//             systemPrompt: agent.prompt,
//             userPrompt: req.body.message
//         };

//         const options = {
//             model: agent.model,
//             temperature: agent.temperature,
//             max_tokens: agent.maxTokens
//         };

//         const stream = await aiService.streamResponse(prompt, options);
        
//         // 设置响应头
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');

//         // 处理流式响应
//         for await (const chunk of stream.data) {
//             const content = chunk.choices[0]?.delta?.content || '';
//             if (content) {
//                 res.write(`data: ${JSON.stringify({ content })}\n\n`);
//             }
//         }

//         res.end();
//     } catch (error) {
//         console.error('Error streaming AI response:', error);
//         res.status(500).json({ message: 'Error streaming AI response', error: error.message });
//     }
// });

// 生成数据报表
router.post('/report/generate', async (req, res) => {
    try {
        const { data, requirements } = req.body;

        // 验证输入
        if (!data) {
            return res.status(400).json({
                code: 400,
                message: '数据不能为空'
            });
        }

        // 调用报表生成服务
        const report = await generateReport(data, requirements);
        
        res.status(200).json({
            code: 200,
            data: report
        });
    } catch (error) {
        console.error('报表生成失败:', error);
        res.status(500).json({
            code: 500,
            message: error.message || '报表生成服务暂时不可用'
        });
    }
});

module.exports = router;
