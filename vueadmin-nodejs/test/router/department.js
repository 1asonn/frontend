const express = require('express');
const Department = require('../database/models/Department');
const router = express.Router();

// 新增部门
router.post('/add', async (req, res) => {
    try {
        const { name, description } = req.body;
        const department = await Department.create({ name, description });
        res.json({
            code: 200,
            data: department,
            message: '部门添加成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '部门添加失败',
            error: error.message
        });
    }
});

// 获取部门列表
router.get('/list', async (req, res) => {
    try {
        const departments = await Department.findAll();
        res.json({
            code: 200,
            data: departments,
            message: '获取部门列表成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '获取部门列表失败',
            error: error.message
        });
    }
});

// 获取单个部门信息
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findByPk(id);
        
        if (!department) {
            return res.status(404).json({
                code: 404,
                message: '部门不存在'
            });
        }
        
        res.json({
            code: 200,
            data: department,
            message: '获取部门信息成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '获取部门信息失败',
            error: error.message
        });
    }
});

// 更新部门信息
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        
        const department = await Department.findByPk(id);
        if (!department) {
            return res.status(404).json({
                code: 404,
                message: '部门不存在'
            });
        }
        
        await department.update({ name, description });
        res.json({
            code: 200,
            data: department,
            message: '部门信息更新成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '部门信息更新失败',
            error: error.message
        });
    }
});

// 删除部门
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findByPk(id);
        
        if (!department) {
            return res.status(404).json({
                code: 404,
                message: '部门不存在'
            });
        }
        
        await department.destroy();
        res.json({
            code: 200,
            message: '部门删除成功'
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '部门删除失败',
            error: error.message
        });
    }
});

module.exports = router;
