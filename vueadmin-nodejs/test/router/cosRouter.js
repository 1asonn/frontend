/**
 * 腾讯云对象存储相关路由
 */
const express = require('express');
const router = express.Router();
const cosController = require('../controllers/cosController');

// 单文件上传
router.post('/upload', cosController.uploadSingle, cosController.uploadFile);

// 多文件上传
router.post('/uploadMultiple', cosController.uploadMultiple, cosController.uploadMultipleFiles);

// 获取文件URL
router.get('/getFileUrl', cosController.getFileUrl);

// 删除文件
router.post('/deleteFile', cosController.deleteFile);

// 批量删除文件
router.post('/deleteMultiple', cosController.deleteMultipleFiles);

// 获取文件列表
router.get('/listFiles', cosController.listFiles);

module.exports = router;
