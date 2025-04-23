const equipmentService = require('../services/equipmentService')
const express = require('express');
const router = express.Router();

// 创建医疗设备
router.post('/create', async (req, res) => {
    try {
        const equipment = await equipmentService.createEquipment(req.body)
        res.json({
            code: 200,
            data: equipment,
            message: '创建成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

// 更新医疗设备
router.put('/update/:id', async (req, res) => {
    try {
        const equipment = await equipmentService.updateEquipment(req.params.id, req.body)
        res.json({
            code: 200,
            data: equipment,
            message: '更新成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

// 删除医疗设备
router.delete('/delete/:id', async (req, res) => {
    try {
        await equipmentService.deleteEquipment(req.params.id)
        res.json({
            code: 200,
            data: null,
            message: '删除成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

// 获取单个医疗设备
router.get('/:id', async (req, res) => {
    try {
        const equipment = await equipmentService.getEquipmentById(req.params.id)
        res.json({
            code: 200,
            data: equipment,
            message: '获取成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

// 分页查询医疗设备
router.get('/list/page', async (req, res) => {
    try {
        const { page = 1, size = 10, ...query } = req.query
        // Convert page and size to integers
        const pageInt = parseInt(page, 10)
        const sizeInt = parseInt(size, 10)
        const result = await equipmentService.getEquipmentList(pageInt, sizeInt, query)
        res.json({
            code: 200,
            data: result,
            message: '查询成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

// 创建维修记录
router.post('/:equipmentId/maintenance', async (req, res) => {
    try {
        const maintenance = await equipmentService.createMaintenance(req.params.equipmentId, req.body)
        res.json({
            code: 200,
            data: maintenance,
            message: '创建成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

// 分页查询维修记录
router.get('/:equipmentId/maintenance/list', async (req, res) => {
    try {
        const { page = 1, size = 10, ...query } = req.query
        // Convert page and size to integers
        const pageInt = parseInt(page, 10)
        const sizeInt = parseInt(size, 10)
        const result = await equipmentService.getMaintenanceList(req.params.equipmentId, pageInt, sizeInt, query)
        res.json({
            code: 200,
            data: result,
            message: '查询成功'
        })
    } catch (error) {
        res.json({
            code: 500,
            data: null,
            message: error.message
        })
    }
})

module.exports = router
