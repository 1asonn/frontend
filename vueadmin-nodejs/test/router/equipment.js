const equipmentService = require('../services/equipmentService')
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cosService = require('../services/cosService');
const path = require('path');

// 配置 multer 的临时存储
const upload = multer({ storage: multer.memoryStorage() });

// 创建医疗设备
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        // 解析设备数据
        let equipmentData;
        try {
            // 如果是通过表单提交，数据会在equipmentData字段中
            equipmentData = req.body.equipmentData ? JSON.parse(req.body.equipmentData) : req.body;
        } catch (e) {
            // 如果解析失败，直接使用body
            equipmentData = req.body;
        }
        
        // 确保创建时不包含图片字段，防止URL过长错误
        delete equipmentData.image_url;
        
        // 创建设备记录
        const equipment = await equipmentService.createEquipment(equipmentData);
        
        // 如果没有上传图片，直接返回创建结果
        if (!req.file) {
            return res.json({
                code: 200,
                data: equipment,
                message: '设备创建成功'
            });
        }
        
        // 如果有图片上传，处理图片
        // 生成文件名和存储路径
        const originalExt = path.extname(req.file.originalname);
        const fileName = `equipment_${equipment.id}_${Date.now()}${originalExt}`;
        const cosKey = cosService.generateFileKey(fileName, 'equipment/');
        
        // 上传文件到腾讯云COS
        const uploadResult = await cosService.uploadFile({
            file: req.file.buffer,
            key: cosKey
        });
        
        if (!uploadResult.success) {
            // 图片上传失败，但设备已创建成功
            return res.json({
                code: 201, // 使用201表示部分成功
                data: equipment,
                message: `设备创建成功，但图片上传失败: ${uploadResult.error}`
            });
        }
        
        // 直接使用COS的永久URL作为图片展示链接
        // 这个链接适合在浏览器中直接展示图片
        const imageUrl = uploadResult.url;
        
        // 更新设备记录中的图片URL
        const updatedEquipment = await equipmentService.updateEquipment(equipment.id, {
            image_url: imageUrl
        });
        
        res.json({
            code: 200,
            data: {
                equipment: updatedEquipment,
                imageUrl: imageUrl,
                cosKey: cosKey
            },
            message: '设备创建成功'
        });
    } catch (error) {
        console.error('创建设备错误:', error);
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

// 上传设备图片
router.post('/upload-image/:id', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.json({
                code: 400,
                data: null,
                message: '未提供图片文件'
            });
        }

        const equipmentId = req.params.id;
        
        // 检查设备是否存在
        const equipment = await equipmentService.getEquipmentById(equipmentId);
        if (!equipment) {
            return res.json({
                code: 404,
                data: null,
                message: '设备不存在'
            });
        }

        // 生成文件名和存储路径
        const originalExt = path.extname(req.file.originalname);
        const fileName = `equipment_${equipmentId}_${Date.now()}${originalExt}`;
        const cosKey = cosService.generateFileKey(fileName, 'equipment/');
        
        // 上传文件到腾讯云COS
        const uploadResult = await cosService.uploadFile({
            file: req.file.buffer,
            key: cosKey
        });
        
        if (!uploadResult.success) {
            throw new Error(`上传到腾讯云COS失败: ${uploadResult.error}`);
        }
        
        // 直接使用COS的永久URL作为图片展示链接
        // 这个链接适合在浏览器中直接展示图片
        const imageUrl = uploadResult.url;
        
        // 更新设备记录中的图片URL
        const updatedEquipment = await equipmentService.updateEquipment(equipmentId, {
            image_url: imageUrl
        });
        
        res.json({
            code: 200,
            data: {
                equipment: updatedEquipment,
                imageUrl: imageUrl,
                cosKey: cosKey
            },
            message: '图片上传成功'
        });
    } catch (error) {
        console.error('上传图片错误:', error);
        res.json({
            code: 500,
            data: null,
            message: '图片上传失败: ' + error.message
        });
    }
});

// 不再需要此函数，使用path.extname代替

module.exports = router
