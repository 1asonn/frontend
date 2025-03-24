const Medicine = require('../database/models/medicine')
const MedicineStock = require('../database/models/medicine_stock')
const { Op } = require('sequelize')

class MedicineController {
    // 获取药品列表
    async getMedicineList(ctx) {
        const { page = 1, pageSize = 10, name, category } = ctx.query
        
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

            ctx.body = {
                code: 200,
                data: {
                    total: count,
                    list: rows,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize)
                }
            }
        } catch (error) {
            console.error('获取药品列表失败:', error)
            ctx.body = {
                code: 500,
                message: '获取药品列表失败'
            }
        }
    }

    // 获取药品详情
    async getMedicineDetail(ctx) {
        const { id } = ctx.params
        
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
                ctx.body = {
                    code: 404,
                    message: '药品不存在'
                }
                return
            }

            ctx.body = {
                code: 200,
                data: medicine
            }
        } catch (error) {
            console.error('获取药品详情失败:', error)
            ctx.body = {
                code: 500,
                message: '获取药品详情失败'
            }
        }
    }

    // 创建药品
    async createMedicine(ctx) {
        const medicineData = ctx.request.body

        try {
            const medicine = await Medicine.create(medicineData)
            ctx.body = {
                code: 200,
                message: '创建成功',
                data: medicine
            }
        } catch (error) {
            console.error('创建药品失败:', error)
            ctx.body = {
                code: 500,
                message: '创建药品失败'
            }
        }
    }

    // 更新药品信息
    async updateMedicine(ctx) {
        const { id } = ctx.params
        const updateData = ctx.request.body

        try {
            const medicine = await Medicine.findByPk(id)
            if (!medicine) {
                ctx.body = {
                    code: 404,
                    message: '药品不存在'
                }
                return
            }

            await medicine.update(updateData)
            ctx.body = {
                code: 200,
                message: '更新成功',
                data: medicine
            }
        } catch (error) {
            console.error('更新药品失败:', error)
            ctx.body = {
                code: 500,
                message: '更新药品失败'
            }
        }
    }

    // 删除药品
    async deleteMedicine(ctx) {
        const { id } = ctx.params

        try {
            const medicine = await Medicine.findByPk(id)
            if (!medicine) {
                ctx.body = {
                    code: 404,
                    message: '药品不存在'
                }
                return
            }

            await medicine.destroy()
            ctx.body = {
                code: 200,
                message: '删除成功'
            }
        } catch (error) {
            console.error('删除药品失败:', error)
            ctx.body = {
                code: 500,
                message: '删除药品失败'
            }
        }
    }

    // 获取药品库存
    async getMedicineStock(ctx) {
        const { medicineId } = ctx.params

        try {
            const stocks = await MedicineStock.findAll({
                where: { medicine_id: medicineId },
                order: [['expiry_date', 'ASC']]
            })

            ctx.body = {
                code: 200,
                data: stocks
            }
        } catch (error) {
            console.error('获取药品库存失败:', error)
            ctx.body = {
                code: 500,
                message: '获取药品库存失败'
            }
        }
    }

    // 更新药品库存
    async updateMedicineStock(ctx) {
        const { id } = ctx.params
        const stockData = ctx.request.body

        try {
            const stock = await MedicineStock.findByPk(id)
            if (!stock) {
                ctx.body = {
                    code: 404,
                    message: '库存记录不存在'
                }
                return
            }

            await stock.update(stockData)
            ctx.body = {
                code: 200,
                message: '更新成功',
                data: stock
            }
        } catch (error) {
            console.error('更新药品库存失败:', error)
            ctx.body = {
                code: 500,
                message: '更新药品库存失败'
            }
        }
    }
}

module.exports = new MedicineController()
