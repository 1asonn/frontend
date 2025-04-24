const equipmentService = require('../services/equipmentService')
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Dropbox } = require('dropbox');
require('isomorphic-fetch'); // 引入 fetch 实现

// 配置 multer 的临时存储
const upload = multer({ storage: multer.memoryStorage() });

// 创建 Dropbox 客户端实例
const dbx = new Dropbox({ 
    accessToken: 'sl.u.AFoB9o6lr9oseyvYRhuCieMSiVtLe8ESTghkXgk2gEpgkeqyIh5VzK4_QJ_JoGrzzN5cEeah0xpst90hgR9xx0fu7yXS0aEX3SljJnUVF0YFtkAsUQC-rlkUQXgmOFED62QpCdw0NNNR7mBAjk-eT3T7ufnzZbO4WgcS_TvbDjmQEwIpPCcX3Bt_kbTdUtTqJc0hjjd_jxy17QpdJA8txmloxhlmcQhuy_qMvodouXIW7cqZaPCmi-DN2ua5BFyp4-DuXEE6kZeeL9sfMdmqYudJQlsjLxG1qyCT7oO6LOCRD3iDHlb4NEBGkN791leBvAJJQCXauMeZliWDfkH_hYMj7sI5oaIHgRJEUI0HPYCpysn5QJB_0pcyeZoOG-ci-lzDGfwuDE9e36uTt4JTkkH1zjVvsW1MsGock2ufiP9t-iR9_dseYrDruGCTkNd40ztr8AyOHc8myselquyreawkPOzzAUuY4j_r2lrRwj11USb5i-CrryP-dAk-iFHGTURf3VMLSM7-mW2L-ij3IPfAJwJ25mcaPT5cR6XDXlJjWC4LvGF6AXCt6aTLY2WVhP_cg0dnCw2bAjTjksdM6WnpuPQ7dAZAGOBQWIuJZhL_gx0LrDEVcCMnLDqUJMOq_VzkeZRT-uluzRec5IZwCVowTR-xxvFeUi-qyvRsuPCx516DYj1y3YE5w_eJqjptoFwq4Z4KUnNcgK-fBs5t197WaZodlikkEJkXL4X3nvNJx58iqHyWSClB2GWc9lzO2jTi5qtZlhnC413zNDAcxVlIpPgnXZknw9uqMqPFdEds37H6wQczyxJZ883suDcnHMKoV8vHSMQ2hNBpksh_3PqnlKNxSYeDr3Z6567z4ALptuOiRaPgjc-Y-inZCi-gtmVvvlgWukqPMz85w0qD17XpLMiLO5CvbOF9YENy8zAWpuCxhxCJYpPx6CZ03K3z-J0Vm4wQP51ROpls2nNv3XaSVFGf_p4y2O-85Zgi4mhfOazobOmoO92r6Q_wL-2Y-NPUFQXP78jTliaFbecynldI4GwUAWNre1WwA8vzLQQ6MOf8MV-v-G0HniHQCf7TlJg3KFHoq5qmIswOVNGUIYeIfkzm45HvqzDbf3Uq6NDB_7FtFB45GOEy4BTL9An3qy8VoR_X1aq8BRRbdyguv78mBTDjSUrvFr-gd85tibC8o3_InOA0c8RKuwZLOnbWEIqNy7oJMGGmobj474fdHw1qLUduszQyTLeOmym4UW9DJFjVXEFBd4QA-9sPUV6B4tstE0ub1osnSHzdqvCTBkk8H5KZAQpwrlM1aLrQqWKNC1vE-SgGddlcBg-be6BWLDAPsmWrHh6hVU3KaDD0i0XuKh7u2liOCu4ojyD9ClYJm9DCr2RC_6e2xEk6yh5ZVoOFGnhYyF9noYs3RpPnZRUgQ-nx5Hq0A_QKis-NAk5kzgOrZkISuzDlP_5RlfEL_oI' 
});

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
