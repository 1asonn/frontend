const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

// 创建维修工单
router.post('/orders', maintenanceController.createMaintenanceOrder);

// 获取工单列表
router.get('/orders', maintenanceController.getMaintenanceOrders);

// 获取工单详情
router.get('/orders/:id', maintenanceController.getMaintenanceOrderById);

// 获取工单历史记录
router.get('/orders/:id/history', maintenanceController.getMaintenanceHistory);

// 处理工单
router.post('/orders/:id/process', maintenanceController.processMaintenanceOrder);

// 完成工单
router.post('/orders/:id/complete', maintenanceController.completeMaintenanceOrder);

// 取消工单
router.post('/orders/:id/cancel', maintenanceController.cancelMaintenanceOrder);

// 更新工单
router.put('/orders/:id', maintenanceController.updateMaintenanceOrder);

// 导出维修数据
router.get('/export', maintenanceController.exportMaintenanceData);

// 获取工单统计数据
router.get('/stats', maintenanceController.getMaintenanceStats);

module.exports = router;
