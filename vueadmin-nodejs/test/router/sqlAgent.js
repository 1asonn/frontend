const express = require('express');
const router = express.Router();
const sqlAgentController = require('../controllers/sqlAgentController');

// 执行自然语言查询
router.post('/query', sqlAgentController.executeQuery);

// 导出查询结果为Excel
router.post('/export', sqlAgentController.exportQueryResult);

module.exports = router;
