const express = require('express');
const router = express.Router();
const AiAgent = require('../database/models/AiAgent');
// const {analyze} = require('../services/aiService');
// import {analyze} from '../services/aiService.mjs'
(async () => {
    try {
        const aiService = await import('../services/aiService.mjs');
        getJsonReply = aiService.getJsonReply;
    } catch (error) {
        console.error('Failed to load aiService:', error);
    }
})();
router.post('/MedicalAnalyze',async (req,res) => {
    try {
        console.log("this is req",req)
        const {record} = req.body
        console.log("this is record",record)
        const response = await getJsonReply((record).toString())
        res.status(200).json({data:response})
    } catch (error) {
        console.log(error)
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

module.exports = router;
