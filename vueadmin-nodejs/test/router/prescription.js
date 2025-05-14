const express = require('express');
const router = express.Router();
const { sequelize, Sequelize } = require('../database/init.js');
const Prescription = require('../database/models/Prescription');
const PrescriptionItem = require('../database/models/PrescriptionItem');
const User = require('../database/models/user');
const MedicineStock = require('../database/models/MedicineStock');
const MedicineTransaction = require('../database/models/MedicineTransaction');
const MedicineTransactionItem = require('../database/models/MedicineTransactionItem');
const { verifyToken } = require('../middleware/auth');
const { Op } = Sequelize;

// 创建处方
router.post('/create', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { 
            patient_id, 
            diagnosis,
            instructions,
            medicines
        } = req.body;

        // 验证必要参数
        if (!patient_id || !medicines || medicines.length === 0) {
            return res.status(400).json({ message: '缺少必要参数' });
        }

        // 获取医生信息（当前登录用户）
        const doctor = await User.findByPk(req.user.userId);
        if (!doctor) {
            return res.status(404).json({ message: '医生信息不存在' });
        }

        // 生成处方编号 (格式: CF + 年月日 + 4位随机数)
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const prescription_no = `CF${dateStr}${randomNum}`;

        // 创建处方
        const prescription = await Prescription.create({
            prescription_no,
            patient_id,
            doctor_id: req.user.userId,
            doctor_name: doctor.realname,
            diagnosis,
            instructions,
            prescription_date: new Date(),
            status: 'pending'
        }, { transaction: t });

        // 创建处方药品明细
        const prescriptionItems = await Promise.all(medicines.map(medicine => {
            return PrescriptionItem.create({
                prescription_id: prescription.id,
                name: medicine.name,
                spec: medicine.spec,
                quantity: medicine.quantity || 1,
                unit: medicine.unit || '盒',
                usage: medicine.usage
            }, { transaction: t });
        }));

        await t.commit();

        res.status(200).json({
            message: '处方创建成功',
            data: {
                id: prescription.id,
                prescription_no: prescription.prescription_no
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('创建处方失败:', error);
        res.status(500).json({ message: '创建处方失败', error: error.message });
    }
});

// 获取处方列表
router.get('/list', verifyToken, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            keyword,
            status,
            start_date,
            end_date,
            patient_id,
            doctor_id
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = {};

        // 添加筛选条件
        if (keyword) {
            where[Op.or] = [
                { prescription_no: { [Op.like]: `%${keyword}%` } },
                { doctor_name: { [Op.like]: `%${keyword}%` } },
                { diagnosis: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (status) {
            where.status = status;
        }
        if (start_date && end_date) {
            where.prescription_date = {
                [Op.between]: [start_date, end_date]
            };
        } else if (start_date) {
            where.prescription_date = { [Op.gte]: start_date };
        } else if (end_date) {
            where.prescription_date = { [Op.lte]: end_date };
        }
        if (patient_id) {
            where.patient_id = patient_id;
        }
        if (doctor_id) {
            where.doctor_id = doctor_id;
        }

        // 查询处方列表
        const { count, rows } = await Prescription.findAndCountAll({
            where,
            include: [
                {
                    model: PrescriptionItem,
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
        console.error('获取处方列表失败:', error);
        res.status(500).json({ message: '获取处方列表失败', error: error.message });
    }
});

// 获取处方详情
router.get('/detail/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // 查询处方
        const prescription = await Prescription.findByPk(id, {
            include: [
                {
                    model: PrescriptionItem,
                    as: 'items'
                }
            ]
        });

        if (!prescription) {
            return res.status(404).json({ message: '处方不存在' });
        }

        res.json(prescription);
    } catch (error) {
        console.error('获取处方详情失败:', error);
        res.status(500).json({ message: '获取处方详情失败', error: error.message });
    }
});

// 发药（处方出库）
router.post('/dispense/:id', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { items } = req.body;

        // 查询处方
        const prescription = await Prescription.findByPk(id, {
            include: [
                {
                    model: PrescriptionItem,
                    as: 'items'
                }
            ]
        });

        if (!prescription) {
            await t.rollback();
            return res.status(404).json({ message: '处方不存在' });
        }

        if (prescription.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: '该处方已发药或已取消，不能重复操作' });
        }

        // 获取操作员信息
        const operator = await User.findByPk(req.user.userId);
        if (!operator) {
            await t.rollback();
            return res.status(404).json({ message: '操作员不存在' });
        }

        // 生成出库单号 (格式: CK + 年月日 + 4位随机数)
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const code = `CK${dateStr}${randomNum}`;

        // 处理出库药品
        const transactionItems = [];
        for (const item of items) {
            // 查找库存
            const stock = await MedicineStock.findOne({
                where: {
                    medicine_id: item.medicine_id,
                    batch_number: item.batch_number,
                    quantity: { [Op.gte]: item.quantity }
                }
            });

            if (!stock) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `药品 ${item.medicine_name} 批号 ${item.batch_number} 库存不足，无法发药` 
                });
            }

            // 更新库存
            await stock.decrement('quantity', { by: item.quantity, transaction: t });

            // 添加到出库药品列表
            transactionItems.push({
                medicine_id: item.medicine_id,
                medicine_name: item.medicine_name,
                specification: item.specification,
                unit: item.unit,
                batch_number: item.batch_number,
                quantity: item.quantity,
                price: item.price,
                amount: item.price * item.quantity,
                production_date: stock.production_date,
                expiry_date: stock.expiry_date,
                location: stock.location,
                usage: item.usage,
                dosage: item.dosage,
                frequency: item.frequency
            });

            // 更新处方药品信息
            await PrescriptionItem.update({
                batch_number: item.batch_number,
                production_date: stock.production_date,
                expiry_date: stock.expiry_date,
                is_dispensed: true
            }, {
                where: { 
                    prescription_id: prescription.id,
                    medicine_id: item.medicine_id
                },
                transaction: t
            });
        }

        // 创建出库单
        const transaction = await MedicineTransaction.create({
            code,
            type: 'out',
            entry_date: new Date(),
            total_amount: prescription.total_amount,
            status: 'approved', // 直接设为已审核状态
            operator_id: req.user.userId,
            operator_name: operator.realname,
            approver_id: req.user.userId, // 自动审核
            approver_name: operator.realname,
            approve_time: new Date(),
            remark: `处方发药出库，处方编号: ${prescription.prescription_no}`,
            prescription_id: prescription.id,
            patient_id: prescription.patient_id,
            patient_name: prescription.patient_name,
            doctor_id: prescription.doctor_id,
            doctor_name: prescription.doctor_name,
            is_insurance: prescription.is_insurance
        }, { transaction: t });

        // 创建出库明细
        await Promise.all(transactionItems.map(item => {
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
                usage: item.usage,
                dosage: item.dosage,
                frequency: item.frequency
            }, { transaction: t });
        }));

        // 更新处方状态
        await prescription.update({
            status: 'dispensed',
            dispensed_by: req.user.userId,
            dispensed_time: new Date()
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: '处方发药成功',
            data: {
                prescription_id: prescription.id,
                transaction_id: transaction.id,
                transaction_code: transaction.code
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('处方发药失败:', error);
        res.status(500).json({ message: '处方发药失败', error: error.message });
    }
});

// 取消处方
router.post('/cancel/:id', verifyToken, async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { cancel_reason } = req.body;

        // 查询处方
        const prescription = await Prescription.findByPk(id);

        if (!prescription) {
            await t.rollback();
            return res.status(404).json({ message: '处方不存在' });
        }

        if (prescription.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({ message: '该处方已发药或已取消，不能重复操作' });
        }

        // 更新处方状态
        await prescription.update({
            status: 'cancelled',
            cancelled_by: req.user.userId,
            cancelled_time: new Date(),
            cancel_reason
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: '处方取消成功',
            data: {
                id: prescription.id
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('取消处方失败:', error);
        res.status(500).json({ message: '取消处方失败', error: error.message });
    }
});

module.exports = router;
