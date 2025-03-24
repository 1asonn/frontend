const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Medicine = require('../database/models/medicine');
const MedicineStock = require('../database/models/medicine_stock');

// 测试路由
router.get('/test', (req, res) => {
    console.log('test route accessed');
    res.send({msg: 'medicine router test'})
})

// 获取药品列表
router.get('/', async (req, res) => {
    const { page = 1, pageSize = 10, name, category } = req.query
    try {
        const where = {}
        if (name) {
            where.name = {
                [Op.like]: `%${name}%`
            }
        }
        if (category) {
            where.category = category
        }

        const { count, rows } = await Medicine.findAndCountAll({
            where,
            offset: (page - 1) * pageSize,
            limit: parseInt(pageSize),
            order: [['created_at', 'DESC']],
            include: [{
                model: MedicineStock,
                as: 'stocks',
                attributes: ['quantity']
            }]
        })

        res.send({
            code: 200,
            data: {
                total: count,
                list: rows,
                page: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        })
    } catch (error) {
        console.error('获取药品列表失败:', error)
        res.status(500).send({
            code: 500,
            message: '获取药品列表失败'
        })
    }
})

// 获取药品详情
router.get('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const medicine = await Medicine.findOne({
            where: { id },
            include: [{
                model: MedicineStock,
                as: 'stocks',
                attributes: ['id', 'batch_number', 'quantity', 'production_date', 'expiry_date']
            }]
        })

        if (!medicine) {
            return res.status(404).send({
                code: 404,
                message: '药品不存在'
            })
        }

        res.send({
            code: 200,
            data: medicine
        })
    } catch (error) {
        console.error('获取药品详情失败:', error)
        res.status(500).send({
            code: 500,
            message: '获取药品详情失败'
        })
    }
})

// 创建药品
router.post('/', async (req, res) => {
    try {
        const medicine = await Medicine.create(req.body)
        res.send({
            code: 200,
            message: '创建成功',
            data: medicine
        })
    } catch (error) {
        console.error('创建药品失败:', error)
        res.status(500).send({
            code: 500,
            message: '创建药品失败'
        })
    }
})

// 更新药品信息
router.put('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const medicine = await Medicine.findByPk(id)
        if (!medicine) {
            return res.status(404).send({
                code: 404,
                message: '药品不存在'
            })
        }

        await medicine.update(req.body)
        res.send({
            code: 200,
            message: '更新成功',
            data: medicine
        })
    } catch (error) {
        console.error('更新药品失败:', error)
        res.status(500).send({
            code: 500,
            message: '更新药品失败'
        })
    }
})

// 删除药品
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const medicine = await Medicine.findByPk(id)
        if (!medicine) {
            return res.status(404).send({
                code: 404,
                message: '药品不存在'
            })
        }

        await medicine.destroy()
        res.send({
            code: 200,
            message: '删除成功'
        })
    } catch (error) {
        console.error('删除药品失败:', error)
        res.status(500).send({
            code: 500,
            message: '删除药品失败'
        })
    }
})

// 获取药品库存
router.get('/:medicineId/stock', async (req, res) => {
    const { medicineId } = req.params
    try {
        const stocks = await MedicineStock.findAll({
            where: { medicine_id: medicineId },
            order: [['expiry_date', 'ASC']]
        })

        res.send({
            code: 200,
            data: stocks
        })
    } catch (error) {
        console.error('获取药品库存失败:', error)
        res.status(500).send({
            code: 500,
            message: '获取药品库存失败'
        })
    }
})

// 更新药品库存
router.put('/stock/:id', async (req, res) => {
    const { id } = req.params
    try {
        const stock = await MedicineStock.findByPk(id)
        if (!stock) {
            return res.status(404).send({
                code: 404,
                message: '库存记录不存在'
            })
        }

        await stock.update(req.body)
        res.send({
            code: 200,
            message: '更新成功',
            data: stock
        })
    } catch (error) {
        console.error('更新药品库存失败:', error)
        res.status(500).send({
            code: 500,
            message: '更新药品库存失败'
        })
    }
})

// 获取药品库存风险提醒
router.get('/risk/alerts', async (req, res) => {
    console.log("正在获取库存风险提醒...");
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        console.log("开始查询数据库...");
        // 查询所有药品及其未过期的库存
        const medicines = await Medicine.findAll({
            include: [{
                model: MedicineStock,
                as: 'stocks',
                attributes: ['id', 'batch_number', 'quantity', 'production_date', 'expiry_date'],
                where: {
                    expiry_date: {
                        [Op.gt]: now // 只查询未过期的库存
                    }
                },
                required: false // 即使没有库存记录也返回药品信息
            }]
        });
        console.log("查询到的药品数量:", medicines.length);

        const alerts = [];

        for (const medicine of medicines) {
            // 计算有效库存总量（未过期）
            const totalStock = medicine.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
            console.log(`药品 ${medicine.name} 的总库存: ${totalStock}`);
            
            // 检查库存是否低于阈值
            if (totalStock <= medicine.stock_threshold) {
                alerts.push({
                    type: 'low_stock',
                    level: 'warning',
                    medicine_id: medicine.id,
                    medicine_name: medicine.name,
                    current_stock: totalStock,
                    threshold: medicine.stock_threshold,
                    message: `药品 ${medicine.name} 当前有效库存 ${totalStock}${medicine.unit} 已低于预警阈值 ${medicine.stock_threshold}${medicine.unit}`
                });
            }

            // 检查近效期库存
            medicine.stocks.forEach(stock => {
                const expiryDate = new Date(stock.expiry_date);
                if (expiryDate <= thirtyDaysFromNow && stock.quantity > 0) {
                    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    alerts.push({
                        type: 'expiring_soon',
                        level: daysUntilExpiry <= 7 ? 'critical' : 'warning',
                        medicine_id: medicine.id,
                        medicine_name: medicine.name,
                        stock_id: stock.id,
                        batch_number: stock.batch_number,
                        quantity: stock.quantity,
                        expiry_date: stock.expiry_date,
                        days_until_expiry: daysUntilExpiry,
                        message: `药品 ${medicine.name} 批号 ${stock.batch_number} 数量 ${stock.quantity}${medicine.unit} 将在 ${daysUntilExpiry} 天后过期`
                    });
                }
            });
        }

        // 对提醒进行排序：critical > warning，同级别按天数或库存差异排序
        alerts.sort((a, b) => {
            if (a.level !== b.level) {
                return a.level === 'critical' ? -1 : 1;
            }
            if (a.type === 'expiring_soon' && b.type === 'expiring_soon') {
                return a.days_until_expiry - b.days_until_expiry;
            }
            if (a.type === 'low_stock' && b.type === 'low_stock') {
                const aStockDiff = a.threshold - a.current_stock;
                const bStockDiff = b.threshold - b.current_stock;
                return bStockDiff - aStockDiff;
            }
            return 0;
        });

        console.log("生成的提醒数量:", alerts.length);
        res.send({
            code: 200,
            data: {
                total: alerts.length,
                critical_count: alerts.filter(a => a.level === 'critical').length,
                warning_count: alerts.filter(a => a.level === 'warning').length,
                alerts: alerts
            }
        });
    } catch (error) {
        console.error('获取库存风险提醒失败:', error);
        res.status(500).send({
            code: 500,
            message: '获取库存风险提醒失败'
        });
    }
});

module.exports = router
