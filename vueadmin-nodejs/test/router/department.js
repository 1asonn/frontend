const express = require('express');
const { Department, User } = require('../database/models');
const { Op } = require('sequelize');
const router = express.Router();

// 新增部门
router.post('/add', async (req, res) => {
    try {
        const { name, description, manager_id } = req.body;
        const department = await Department.create({ 
            name, 
            description, 
            manager_id: manager_id || null 
        });
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
        const { name, manager } = req.query;
        
        // 构建查询条件
        const where = {};
        if (name) {
            where.name = {
                [Op.like]: `%${name}%`
            };
        }
        
        // 先获取所有符合条件的部门
        const departments = await Department.findAll({ where });
        
        // 获取所有用户，用于负责人查询
        let users = [];
        if (manager) {
            users = await User.findAll({
                where: {
                    realname: {
                        [Op.like]: `%${manager}%`
                    }
                },
                attributes: ['id', 'realname']
            });
        }
        
        // 如果指定了负责人查询条件但没有找到匹配的用户，返回空结果
        if (manager && users.length === 0) {
            return res.json({
                code: 200,
                data: [],
                message: '获取部门列表成功'
            });
        }
        
        // 如果指定了负责人查询条件，筛选出负责人ID匹配的部门
        const filteredDepartments = manager ? departments.filter(dept => {
            const managerIds = users.map(user => user.id);
            return dept.manager_id && managerIds.includes(dept.manager_id);
        }) : departments;
        
        // 获取部门及其负责人信息
        const departmentsWithManagers = await Promise.all(filteredDepartments.map(async (dept) => {
            const deptData = dept.get({ plain: true });
            
            if (deptData.manager_id) {
                const manager = await User.findByPk(deptData.manager_id, {
                    attributes: [
                        'id', 'realname', 'phone', 'gender', 
                        'address'
                    ]
                });
                if (manager) {
                    const managerData = manager.get({ plain: true });
                    deptData.manager = managerData;
                }
            } else {
                deptData.manager = null;
            }
            
            return deptData;
        }));
        
        res.json({
            code: 200,
            data: departmentsWithManagers,
            message: '获取部门列表成功'
        });
    } catch (error) {
        console.error('获取部门列表错误:', error);
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
        
        // 获取部门数据
        const deptData = department.get({ plain: true });
        
        // 如果有负责人，获取负责人信息
        if (deptData.manager_id) {
            const manager = await User.findByPk(deptData.manager_id, {
                attributes: ['id', 'username', 'name']
            });
            if (manager) {
                deptData.manager = manager.get({ plain: true });
            }
        } else {
            deptData.manager = null;
        }
        
        res.json({
            code: 200,
            data: deptData,
            message: '获取部门信息成功'
        });
    } catch (error) {
        console.error('获取部门信息错误:', error);
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
        const { name, description, manager_id } = req.body;
        
        const department = await Department.findByPk(id);
        if (!department) {
            return res.status(404).json({
                code: 404,
                message: '部门不存在'
            });
        }
        
        await department.update({ 
            name, 
            description, 
            manager_id: manager_id || null 
        });

        // 获取更新后的部门信息
        const updatedDepartment = await Department.findByPk(id);
        const deptData = updatedDepartment.get({ plain: true });
        
        // 如果有负责人，获取负责人信息
        if (deptData.manager_id) {
            const manager = await User.findByPk(deptData.manager_id, {
                attributes: ['id', 'username', 'name']
            });
            if (manager) {
                deptData.manager = manager.get({ plain: true });
            }
        } else {
            deptData.manager = null;
        }
        
        res.json({
            code: 200,
            data: deptData,
            message: '部门信息更新成功'
        });
    } catch (error) {
        console.error('部门信息更新错误:', error);
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
