const express = require('express');
const router = express.Router();
const { sequelize, Sequelize } = require('../database/init.js');
const MedicineTransaction = require('../database/models/MedicineTransaction');
const MedicineTransactionItem = require('../database/models/MedicineTransactionItem');
const MedicineStock = require('../database/models/MedicineStock');
const MedicineStockHistory = require('../database/models/MedicineStockHistory');
const User = require('../database/models/user');
const Supplier = require('../database/models/Supplier');
const Department = require('../database/models/Department');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const Op = Sequelize.Op;

// 中间件：验证JWT令牌
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: '未提供令牌' });
    }

    jwt.verify(token.split(' ')[1], "yyjkn", (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: '令牌无效或已过期' });
        }
        console.log('解析后的身份信息',decoded)
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
        const operator = await User.findByPk(req.user.userId);
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
            operator_id: req.user.userId,
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

        res.status(200).json({
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

// 创建出库单
router.post('/createStockOut', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { 
            department_id, 
            entry_date, 
            items, 
            remark 
        } = req.body;

        if (!department_id || !entry_date || !items || items.length === 0) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 获取部门信息
        const department = await Department.findByPk(department_id);
        if (!department) {
            return res.status(404).json({ message: '部门不存在' });
        }

        // 获取操作员信息
        const operator = await User.findByPk(req.user.id);
        if (!operator) {
            return res.status(404).json({ message: '操作员不存在' });
        }

        // 生成出库单号 (格式: CK + 年月日 + 4位随机数)
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const code = `CK${dateStr}${randomNum}`;

        // 计算总金额
        const total_amount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

        // 创建交易单（出库）
        const transaction = await MedicineTransaction.create({
            code,
            type: 'out', // 出库类型
            department_id,
            department_name: department.name,
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

        res.status(200).json({
            message: '出库单创建成功',
            data: {
                id: transaction.id,
                code: transaction.code
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('创建出库单失败:', error);
        res.status(500).json({ message: '创建出库单失败', error: error.message });
    }
});

// 从电子处方生成出库单
router.post('/createStockOutFromPrescription', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { 
            prescription_id,         // 处方ID
            patient_id,              // 患者ID
            patient_name,            // 患者姓名
            doctor_id,               // 医生ID
            doctor_name,             // 医生姓名
            department_id,           // 科室ID
            department_name,         // 科室名称
            prescription_items,      // 处方药品列表
            prescription_date,       // 处方日期
            prescription_remark,     // 处方备注
            is_insurance             // 是否医保
        } = req.body;

        console.log("请求体",req.body)
        // 验证必要参数
        if (!prescription_id || !patient_id || !department_id || !prescription_items || prescription_items.length === 0) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 获取部门信息
        const department = await Department.findByPk(department_id);
        if (!department) {
            return res.status(404).json({ message: '部门不存在' });
        }

        // 获取操作员信息
        const operator = await User.findByPk(req.user.userId);
        if (!operator) {
            return res.status(404).json({ message: '操作员不存在' });
        }

        // 生成出库单号 (格式: CK + 年月日 + 4位随机数)
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const code = `CK${dateStr}${randomNum}`;

        // 将处方药品转换为出库单药品
        const items = [];
        let total_amount = 0;

        // 首先获取所有处方药品的库存信息
        for (const item of prescription_items) {
            // 检查库存是否足够
            console.log("药品id",item.medicine_id)
            let stock = await MedicineStock.findOne({
                where: {
                    medicine_id: item.medicine_id,
                    batch_number: item.batch_number || { [Op.ne]: null }
                },
                attributes: ['id', 'medicine_id', 'medicine_name', 'batch_number', 'quantity', 
                          'unit', 'specification', 'production_date', 'expiry_date', 'location'],
                order: [['expiry_date', 'ASC']] // 选择最早过期的库存先出
            });

            // 如果没有指定批号，选择任意一个有库存的批次
            if (!stock && !item.batch_number) {
                stock = await MedicineStock.findOne({
                    where: {
                        medicine_id: item.medicine_id,
                        quantity: { [Op.gte]: item.quantity }
                    },
                    attributes: ['id', 'medicine_id', 'medicine_name', 'batch_number', 'quantity', 
                              'unit', 'specification', 'production_date', 'expiry_date', 'location'],
                    order: [['expiry_date', 'ASC']]
                });
            }

            if (!stock || stock.quantity < item.quantity) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `药品 ${item.medicine_name || stock?.medicine_name} 库存不足，无法生成出库单` 
                });
            }

            // 计算金额
            const amount = parseFloat(item.price || 0) * parseInt(item.quantity || 0);
            total_amount += amount;

            // 添加到出库药品列表
            items.push({
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name || stock.medicine_name,
                specification: item.specification || stock.specification,
                unit: item.unit || stock.unit,
                batch_number: stock.batch_number,
                quantity: item.quantity,
                price: item.price || 0,
                amount: amount,
                production_date: stock.production_date,
                expiry_date: stock.expiry_date,
                location: stock.location,
                usage: item.usage || '',             // 用法
                dosage: item.dosage || '',           // 剂量
                frequency: item.frequency || ''      // 频次
            });
        }

        // 创建出库单
        const transaction = await MedicineTransaction.create({
            code,
            type: 'out', // 出库类型
            department_id,
            department_name: department_name || department.name,
            entry_date: prescription_date || new Date(),
            total_amount,
            status: 'pending',
            operator_id: req.user.userId,
            operator_name: operator.realname,
            remark: `根据患者 ${patient_name}(编号:${patient_id}) 的处方(编号:${prescription_id})生成的出库单。医生: ${doctor_name || '未知'}. ${prescription_remark ? '备注: ' + prescription_remark : ''}`,
            // 添加处方相关字段
            prescription_id,
            patient_id,
            patient_name,
            doctor_id,
            doctor_name,
            is_insurance: is_insurance || false
        }, { transaction: t });

        // 创建出库明细
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
                location: item.location,
                // 添加用药说明
                usage: item.usage,
                dosage: item.dosage,
                frequency: item.frequency
            }, { transaction: t });
        }));

        await t.commit();

        res.status(200).json({
            message: '从处方生成出库单成功',
            data: {
                id: transaction.id,
                code: transaction.code,
                prescription_id: prescription_id,
                patient_name: patient_name
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('从处方生成出库单失败:', error);
        res.status(500).json({ message: '从处方生成出库单失败', error: error.message });
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
            end_date 
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
        if (status) {
            where.status = status;
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
            items: rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取入库单列表失败:', error);
        res.status(500).json({ message: '获取入库单列表失败', error: error.message });
    }
});

// 获取出库单列表
router.get('/getStockOutList', verifyToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            keyword, 
            status, 
            start_date, 
            end_date 
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {
            type: 'out' // 只查询出库类型
        };

        // 添加筛选条件
        if (keyword) {
            where[Op.or] = [
                { code: { [Op.like]: `%${keyword}%` } },
                { '$items.medicine_name$': { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (status) {
            where.status = status;
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

        // 查询出库单
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
            items: rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取出库单列表失败:', error);
        res.status(500).json({ message: '获取出库单列表失败', error: error.message });
    }
});

// 获取交易单详情
router.get('/getTransactionDetail/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 查询交易单
        const transaction = await MedicineTransaction.findByPk(id, {
            include: [
                {
                    model: MedicineTransactionItem,
                    as: 'items'
                }
            ]
        });

        if (!transaction) {
            return res.status(404).json({ message: '交易单不存在' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('获取交易单详情失败:', error);
        res.status(500).json({ message: '获取交易单详情失败', error: error.message });
    }
});

// 审核交易单
router.put('/approveTransaction/:id', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { remark } = req.body;

        console.log('审核交易单 ID:', id);

        // 查询交易单
        const transaction = await MedicineTransaction.findByPk(id, {
            include: [
                {
                    model: MedicineTransactionItem,
                    as: 'items'
                }
            ],
            transaction: t
        });
        
        // 打印交易单信息以排查问题
        console.log('查询到的交易单:', JSON.stringify(transaction));

        if (!transaction) {
            await t.rollback();
            return res.status(404).json({ message: '交易单不存在' });
        }

        // 检查交易单状态
        if (transaction.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: '只能审核待审核状态的交易单' });
        }

        // 获取审核人信息
        const approver = await User.findByPk(req.user.userId);
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
                attributes: ['id', 'medicine_id', 'medicine_name', 'batch_number', 'quantity', 
                           'unit', 'specification', 'production_date', 'expiry_date', 'location', 
                           'last_update_time'],
                transaction: t
            });

            const quantityChange = transaction.type === 'in' ? item.quantity : -item.quantity;
            const quantityBefore = stock ? stock.quantity : 0;
            const quantityAfter = quantityBefore + quantityChange;

            // 如果是出库，检查库存是否足够
            if (transaction.type === 'out' && (quantityBefore < item.quantity)) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `药品 ${item.medicine_name} (批号: ${item.batch_number}) 库存不足，当前库存: ${quantityBefore}，需要出库: ${item.quantity}` 
                });
            }

            // 如果库存记录不存在，创建新记录（仅入库时）
            if (!stock && transaction.type === 'in') {
                // 打印创建库存记录的信息
                console.log('创建新库存记录:', {
                    medicine_id: item.medicine_id,
                    medicine_name: item.medicine_name,
                    batch_number: item.batch_number
                });
                
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
                    // 暂时不使用supplier_id字段
                    // supplier_id: transaction.supplier_id,
                    last_update_time: new Date()
                }, { transaction: t });
            } else if (stock) {
                // 更新现有库存
                await stock.update({
                    quantity: quantityAfter,
                    last_update_time: new Date()
                }, { transaction: t });
            }

            // 记录库存历史
            try {
                await MedicineStockHistory.create({
                    medicine_id: item.medicine_id,
                    medicine_name: item.medicine_name,
                    batch_number: item.batch_number,
                    transaction_id: transaction.id,
                    transaction_code: transaction.code,
                    transaction_type: transaction.type,
                    quantity_change: quantityChange,
                    quantity_before: quantityBefore,
                    quantity_after: quantityAfter,
                    operator_id: req.user.userId,  // 确保使用userId而不是id
                    operator_name: approver.realname,
                    operation_time: new Date(),
                    remark
                }, { transaction: t });
            } catch (historyError) {
                console.error('创建库存历史记录失败:', historyError);
                throw historyError; // 重新抛出以触发回滚
            }
        }

        // 更新交易单状态
        await transaction.update({
            status: 'approved',
            approver_id: req.user.id,
            approver_name: approver.realname,
            approve_time: new Date(),
            approve_remark: remark
        }, { transaction: t });

        await t.commit();

        res.json({
            message: '交易单审核成功',
            data: {
                id: transaction.id,
                code: transaction.code,
                status: 'approved'
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('审核交易单失败:', error);
        res.status(500).json({ message: '审核交易单失败', error: error.message });
    }
});

// 取消交易单
router.put('/cancelTransaction/:id', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            await t.rollback();
            return res.status(400).json({ message: '取消原因不能为空' });
        }

        // 查询交易单
        const transaction = await MedicineTransaction.findByPk(id, { transaction: t });
        if (!transaction) {
            await t.rollback();
            return res.status(404).json({ message: '交易单不存在' });
        }

        // 检查交易单状态
        if (transaction.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: '只能取消待审核状态的交易单' });
        }

        // 更新交易单状态
        await transaction.update({
            status: 'cancelled',
            cancel_reason: reason,
            cancel_time: new Date()
        }, { transaction: t });

        await t.commit();

        res.json({
            message: '交易单取消成功',
            data: {
                id: transaction.id,
                code: transaction.code,
                status: 'cancelled'
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('取消交易单失败:', error);
        res.status(500).json({ message: '取消交易单失败', error: error.message });
    }
});

// 获取库存列表
router.get('/getStockList', verifyToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            medicine_id,
            medicine_name,
            batch_number,
            expiry_start_date,
            expiry_end_date
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        // 添加筛选条件
        if (medicine_id) {
            where.medicine_id = medicine_id;
        }
        if (medicine_name) {
            where.medicine_name = { [Op.like]: `%${medicine_name}%` };
        }
        if (batch_number) {
            where.batch_number = { [Op.like]: `%${batch_number}%` };
        }
        if (expiry_start_date && expiry_end_date) {
            where.expiry_date = {
                [Op.between]: [expiry_start_date, expiry_end_date]
            };
        } else if (expiry_start_date) {
            where.expiry_date = { [Op.gte]: expiry_start_date };
        } else if (expiry_end_date) {
            where.expiry_date = { [Op.lte]: expiry_end_date };
        }

        // 查询库存
        const { count, rows } = await MedicineStock.findAndCountAll({
            where,
            order: [['expiry_date', 'ASC']],
            offset,
            limit: parseInt(limit)
        });

        res.json({
            total: count,
            items: rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取库存列表失败:', error);
        res.status(500).json({ message: '获取库存列表失败', error: error.message });
    }
});

// 获取库存历史记录
router.get('/getStockHistory', verifyToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            medicine_id,
            batch_number,
            transaction_type,
            start_date,
            end_date
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        // 添加筛选条件
        if (medicine_id) {
            where.medicine_id = medicine_id;
        }
        if (batch_number) {
            where.batch_number = batch_number;
        }
        if (transaction_type) {
            where.transaction_type = transaction_type;
        }
        if (start_date && end_date) {
            where.operation_time = {
                [Op.between]: [start_date, end_date]
            };
        } else if (start_date) {
            where.operation_time = { [Op.gte]: start_date };
        } else if (end_date) {
            where.operation_time = { [Op.lte]: end_date };
        }

        // 查询库存历史
        const { count, rows } = await MedicineStockHistory.findAndCountAll({
            where,
            order: [['operation_time', 'DESC']],
            offset,
            limit: parseInt(limit)
        });

        res.json({
            total: count,
            items: rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('获取库存历史记录失败:', error);
        res.status(500).json({ message: '获取库存历史记录失败', error: error.message });
    }
});

module.exports = router;
