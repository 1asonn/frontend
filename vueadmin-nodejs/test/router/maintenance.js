const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const multer = require('multer');

// 配置 multer 的临时存储
const storage = multer.memoryStorage();

// 创建一个更灵活的multer实例，不指定字段名，接受任何文件字段
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为10MB
});

// 创建维修工单
router.post('/orders', upload.any(), maintenanceController.createMaintenanceOrder);

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

// 为工单添加图片
router.post('/orders/:id/upload-images', upload.any(), maintenanceController.addOrderImages);

// 导出维修数据
router.get('/export', maintenanceController.exportMaintenanceData);

// 获取工单统计数据
router.get('/stats', maintenanceController.getMaintenanceStats);

// 获取设备维修历史记录
router.get('/equipment/:equipmentId/history', maintenanceController.getEquipmentMaintenanceHistory);

module.exports = router;
