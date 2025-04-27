const equipmentService = require('../services/equipmentService')
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDropboxClient } = require('../utils/dropboxAuth');

// 配置 multer 的临时存储
const upload = multer({ storage: multer.memoryStorage() });

// 创建医疗设备
router.post('/create', async (req, res) => {
    try {
        // 创建设备记录，不包含图片字段
        const equipmentData = { ...req.body };
        // 确保创建时不包含图片字段，防止URL过长错误
        delete equipmentData.image_url;
        
        const equipment = await equipmentService.createEquipment(equipmentData);
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

        // 获取带有有效 token 的 Dropbox 客户端
        const dbx = await getDropboxClient();

        // 设置文件路径和名称
        const fileName = `equipment_${equipmentId}_${Date.now()}${getExtension(req.file.originalname)}`;
        const filePath = `/equipment/${fileName}`;
        
        // 上传文件到Dropbox
        const uploadResponse = await dbx.filesUpload({
            path: filePath,
            contents: req.file.buffer,
            mode: 'overwrite'
        });
        
        // 获取共享链接
        const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
            path: filePath,
            settings: {
                requested_visibility: { '.tag': 'public' }
            }
        });
        
        // 获取直接下载链接（替换dl=0为dl=1）
        const directLink = linkResponse.result.url.replace('dl=0', 'dl=1');
        
        // 更新设备记录中的图片URL
        const updatedEquipment = await equipmentService.updateEquipment(equipmentId, {
            image_url: directLink
        });
        
        res.json({
            code: 200,
            data: {
                equipment: updatedEquipment,
                imageUrl: directLink
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

// 获取文件扩展名的辅助函数
function getExtension(filename) {
    return filename.substring(filename.lastIndexOf('.'));
}

module.exports = router
