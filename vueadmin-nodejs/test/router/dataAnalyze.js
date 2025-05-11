const express = require('express');
const router = express.Router();
const dataAnalyzeController = require('../controllers/dataAnalyzeController');

// 分析Excel数据 - 接收Excel文件URL，返回分析结果 (一次性响应)
router.post('/analyze', dataAnalyzeController.analyzeData);

// 分析Excel数据 - 流式响应版本，实时返回分析进展
router.post('/analyze/stream', dataAnalyzeController.analyzeDataStream);

// 导出分析结果到Excel并上传到腾讯云COS
router.post('/export', dataAnalyzeController.exportToExcel);

// 获取数据分析文件列表
router.get('/files', dataAnalyzeController.getFileList);

module.exports = router;
