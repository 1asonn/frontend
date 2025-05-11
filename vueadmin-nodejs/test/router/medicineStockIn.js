const express = require('express');
const router = express.Router();
const { sequelize, Sequelize } = require('../database/init.js');
const MedicineTransaction = require('../database/models/MedicineTransaction');
const MedicineTransactionItem = require('../database/models/MedicineTransactionItem');
const MedicineStock = require('../database/models/MedicineStock');
const MedicineStockHistory = require('../database/models/MedicineStockHistory');
const User = require('../database/models/user');
const Supplier = require('../database/models/Supplier');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const Op = Sequelize.Op;

// 中间件：验证JWT令牌
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: '未提供令牌' });
    }

    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: '令牌无效或已过期' });
        }
        req.user = decoded;
        next();
    });
};

// 创建入库单
router.post('/createStockIn', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { 
            supplier_id, 
            entry_date, 
            items, 
            remark 
        } = req.body;

        if (!supplier_id || !entry_date || !items || items.length === 0) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 获取供应商信息
        const supplier = await Supplier.findByPk(supplier_id);
        if (!supplier) {
            return res.status(404).json({ message: '供应商不存在' });
        }

        // 获取操作员信息
        const operator = await User.findByPk(req.user.id);
        if (!operator) {
            return res.status(404).json({ message: '操作员不存在' });
        }

        // 生成入库单号 (格式: RK + 年月日 + 4位随机数)
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const code = `RK${dateStr}${randomNum}`;

        // 计算总金额
        const total_amount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

        // 创建交易单（入库）
        const transaction = await MedicineTransaction.create({
            code,
            type: 'in', // 入库类型
            supplier_id,
            supplier_name: supplier.name,
            entry_date,
            total_amount,
            status: 'pending',
            operator_id: req.user.id,
            operator_name: operator.realname,
            remark
        }, { transaction: t });

        // 创建交易明细
        const transactionItems = await Promise.all(items.map(item => {
            return MedicineTransactionItem.create({
                transaction_id: transaction.id,
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name,
                specification: item.specification,
                unit: item.unit,
                batch_number: item.batch_number,
                quantity: item.quantity,
                price: item.price,
                amount: item.amount,
                production_date: item.production_date,
                expiry_date: item.expiry_date,
                location: item.location
            }, { transaction: t });
        }));

        await t.commit();

        res.status(201).json({
            message: '入库单创建成功',
            data: {
                id: transaction.id,
                code: transaction.code
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('创建入库单失败:', error);
        res.status(500).json({ message: '创建入库单失败', error: error.message });
    }
});

// 获取入库单列表
router.get('/getStockInList', verifyToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            keyword, 
            status, 
            start_date, 
            end_date,
            operator_name,
            supplier_name
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {
            type: 'in' // 只查询入库类型
        };

        // 添加筛选条件
        if (keyword) {
            where[Op.or] = [
                { code: { [Op.like]: `%${keyword}%` } },
                { '$items.medicine_name$': { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (supplier_name) {
            where.supplier_name = { [Op.like]: `%${supplier_name}%` };
        }
        if (status) {
            where.status = status;
        }
        if (operator_name) {
            where.operator_name = { [Op.like]: `%${operator_name}%` };
        }
        if (start_date && end_date) {
            where.entry_date = {
                [Op.between]: [start_date, end_date]
            };
        } else if (start_date) {
            where.entry_date = { [Op.gte]: start_date };
        } else if (end_date) {
            where.entry_date = { [Op.lte]: end_date };
        }

        // 查询入库单
        const { count, rows } = await MedicineTransaction.findAndCountAll({
            where,
            include: [
                {
                    model: MedicineTransactionItem,
                    as: 'items'
                }
            ],
            order: [['created_at', 'DESC']],
            offset,
            limit: parseInt(limit),
            distinct: true
        });

        res.json({
            total: count,
            data: rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取入库单列表失败:', error);
        res.status(500).json({ message: '获取入库单列表失败', error: error.message });
    }
});

// 获取入库单详情
router.get('/getStockInById/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 查询入库单
        const transaction = await MedicineTransaction.findByPk(id, {
            include: [
                {
                    model: MedicineTransactionItem,
                    as: 'items'
                }
            ]
        });
        
        if (!transaction) {
            return res.status(404).json({ message: '入库单不存在' });
        }

        // 检查是否为入库类型
        if (transaction.type !== 'in') {
            return res.status(400).json({ message: '指定ID不是入库单' });
        }

        res.json({
            data: transaction
        });
    } catch (error) {
        console.error('获取入库单详情失败:', error);
        res.status(500).json({ message: '获取入库单详情失败', error: error.message });
    }
});

// 审核入库单
router.put('/approveStockIn/:id', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { remark } = req.body;

        // 查询入库单
        const transaction = await MedicineTransaction.findByPk(id, {
            include: [
                {
                    model: MedicineTransactionItem,
                    as: 'items'
                }
            ],
            transaction: t
        });

        if (!transaction) {
            await t.rollback();
            return res.status(404).json({ message: '入库单不存在' });
        }

        // 检查是否为入库类型
        if (transaction.type !== 'in') {
            await t.rollback();
            return res.status(400).json({ message: '指定ID不是入库单' });
        }

        // 检查入库单状态
        if (transaction.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: '只能审核待审核状态的入库单' });
        }

        // 获取审核人信息
        const approver = await User.findByPk(req.user.id);
        if (!approver) {
            await t.rollback();
            return res.status(404).json({ message: '审核人不存在' });
        }

        // 更新库存
        for (const item of transaction.items) {
            // 查找当前库存
            let stock = await MedicineStock.findOne({
                where: {
                    medicine_id: item.medicine_id,
                    batch_number: item.batch_number
                },
                transaction: t
            });

            const quantityBefore = stock ? stock.quantity : 0;
            const quantityAfter = quantityBefore + item.quantity;

            // 如果库存记录不存在，创建新记录
            if (!stock) {
                stock = await MedicineStock.create({
                    medicine_id: item.medicine_id,
                    medicine_name: item.medicine_name,
                    batch_number: item.batch_number,
                    quantity: item.quantity,
                    unit: item.unit,
                    specification: item.specification,
                    production_date: item.production_date,
                    expiry_date: item.expiry_date,
                    location: item.location,
                    last_update_time: new Date()
                }, { transaction: t });
            } else {
                // 更新现有库存
                await stock.update({
                    quantity: quantityAfter,
                    last_update_time: new Date()
                }, { transaction: t });
            }

            // 记录库存历史
            await MedicineStockHistory.create({
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name,
                batch_number: item.batch_number,
                transaction_id: transaction.id,
                transaction_code: transaction.code,
                transaction_type: transaction.type,
                quantity_change: item.quantity,
                quantity_before: quantityBefore,
                quantity_after: quantityAfter,
                operator_id: req.user.id,
                operator_name: approver.realname,
                operation_time: new Date(),
                remark
            }, { transaction: t });
        }

        // 更新入库单状态
        await transaction.update({
            status: 'approved',
            approver_id: req.user.id,
            approver_name: approver.realname,
            approve_time: new Date(),
            approve_remark: remark
        }, { transaction: t });

        await t.commit();

        res.json({
            message: '入库单审核成功',
            data: {
                id: transaction.id,
                code: transaction.code,
                status: 'approved'
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('审核入库单失败:', error);
        res.status(500).json({ message: '审核入库单失败', error: error.message });
    }
});

// 取消入库单
router.put('/cancelStockIn/:id', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            await t.rollback();
            return res.status(400).json({ message: '取消原因不能为空' });
        }

        // 查询入库单
        const transaction = await MedicineTransaction.findByPk(id, { transaction: t });
        if (!transaction) {
            await t.rollback();
            return res.status(404).json({ message: '入库单不存在' });
        }

        // 检查是否为入库类型
        if (transaction.type !== 'in') {
            await t.rollback();
            return res.status(400).json({ message: '指定ID不是入库单' });
        }

        // 检查入库单状态
        if (transaction.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: '只能取消待审核状态的入库单' });
        }

        // 更新入库单状态
        await transaction.update({
            status: 'cancelled',
            cancel_reason: reason,
            cancel_time: new Date()
        }, { transaction: t });

        await t.commit();

        res.json({
            message: '入库单取消成功',
            data: {
                id: transaction.id,
                code: transaction.code,
                status: 'cancelled'
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('取消入库单失败:', error);
        res.status(500).json({ message: '取消入库单失败', error: error.message });
    }
});

module.exports = router;
