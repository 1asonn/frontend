const express = require('express');
const router = express.Router();
const { Supplier, User } = require('../database/models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'yyjkn';

// 统一响应格式
const createResponse = (success, message, data = null) => {
    return {
        code: success ? 200 : 400,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

// 验证JWT中间件
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json(createResponse(false, 'token为空!'));
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT验证错误:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json(createResponse(false, '无效的token'));
        }
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
};

// 获取供应商列表（分页）
router.get('/getSupplierList', verifyToken, async (req, res) => {
    try {
        const { current = 1, size = 10, name, contact_person } = req.query;
        
        // 构建查询条件
        const where = {};
        
        if (name) {
            where.name = {
                [Op.like]: `%${name}%`
            };
        }
        
        if (contact_person) {
            where.contact_person = {
                [Op.like]: `%${contact_person}%`
            };
        }
        
        // 执行查询
        const { count, rows } = await Supplier.findAndCountAll({
            where,
            offset: (parseInt(current) - 1) * parseInt(size),
            limit: parseInt(size),
            order: [['created_at', 'DESC']],
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'username', 'realname'],
                required: false
            }]
        });
        
        res.json(createResponse(true, '获取供应商列表成功', {
            records: rows,
            total: count,
            size: parseInt(size),
            current: parseInt(current)
        }));
    } catch (error) {
        console.error('获取供应商列表错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 获取供应商详情
router.get('/getSupplierById/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const supplier = await Supplier.findByPk(id, {
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'username', 'realname'],
                required: false
            }]
        });
        
        if (!supplier) {
            return res.status(404).json(createResponse(false, '供应商不存在'));
        }
        
        res.json(createResponse(true, '获取供应商详情成功', supplier));
    } catch (error) {
        console.error('获取供应商详情错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 创建供应商
router.post('/createSupplier', verifyToken, async (req, res) => {
    try {
        const { name, contact_person, contact_phone, address, notes } = req.body;
        
        // 验证必填字段
        if (!name) {
            return res.status(400).json(createResponse(false, '供应商名称不能为空'));
        }
        
        // 创建供应商
        const supplier = await Supplier.create({
            name,
            contact_person,
            contact_phone,
            address,
            notes,
            created_by: req.user.id
        });
        
        res.json(createResponse(true, '创建供应商成功', supplier));
    } catch (error) {
        console.error('创建供应商错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 更新供应商
router.put('/updateSupplier/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, contact_phone, address, notes } = req.body;
        
        // 验证必填字段
        if (!name) {
            return res.status(400).json(createResponse(false, '供应商名称不能为空'));
        }
        
        // 查找供应商
        const supplier = await Supplier.findByPk(id);
        
        if (!supplier) {
            return res.status(404).json(createResponse(false, '供应商不存在'));
        }
        
        // 更新供应商
        await supplier.update({
            name,
            contact_person,
            contact_phone,
            address,
            notes
        });
        
        res.json(createResponse(true, '更新供应商成功', supplier));
    } catch (error) {
        console.error('更新供应商错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 删除供应商
router.delete('/deleteSupplier/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 查找供应商
        const supplier = await Supplier.findByPk(id);
        
        if (!supplier) {
            return res.status(404).json(createResponse(false, '供应商不存在'));
        }
        
        // 删除供应商
        await supplier.destroy();
        
        res.json(createResponse(true, '删除供应商成功'));
    } catch (error) {
        console.error('删除供应商错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 获取所有供应商（不分页，用于下拉选择）
router.get('/getAllSuppliers', verifyToken, async (req, res) => {
    try {
        const suppliers = await Supplier.findAll({
            attributes: ['id', 'name', 'contact_person', 'contact_phone'],
            order: [['name', 'ASC']]
        });
        
        res.json(createResponse(true, '获取所有供应商成功', suppliers));
    } catch (error) {
        console.error('获取所有供应商错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

module.exports = router;
