const express = require('express');
const Role = require('../database/models/Role')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const filterNav = require('../utils/funcs')
const user = require('../database/models/user')
const nav = require('../assets/nav')
const { encryptData } = require('../utils/crypto');
const rateLimit = require('express-rate-limit');
const { signData, getPublicKey } = require('../utils/crypto');
const { Op } = require('sequelize');

// // 创建请求限制器
// const menuLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15分钟窗口
//     max: 1000000, // 每个IP在窗口期内最多100次请求
//     message: { code: 429, message: '请求过于频繁，请稍后再试' }
// });

// 菜单缓存
const menuCache = new Map();
const CACHE_DURATION = 5; // 5分钟缓存

// 获取公钥接口
router.get('/public-key', (req, res) => {
    res.json({
        code: 200,
        data: {
            publicKey: getPublicKey()
        }
    });
});

//获取角色下的可用菜单
router.get('/getRoleAuthorities', async (req, res) => {
    try {
        // 从请求头中获取 token 并解析用户名
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                code: 401, 
                message: '未提供访问令牌' 
            });
        }

        const { username } = jwt.verify(token, process.env.JWT_SECRET || "yyjkn");

        // 检查缓存
        const cacheKey = `menu_${username}`;
        const cachedMenu = menuCache.get(cacheKey);
        if (cachedMenu && cachedMenu.timestamp > Date.now() - CACHE_DURATION) {
            return res.json({
                code: 200,
                data: cachedMenu.data
            });
        }

        // 查询用户及其角色信息
        const userInfo = await user.findOne({
            where: { username },
            include: [
                {
                    model: Role,
                    as: 'role', // 假设 user 模型中有关联的 role
                    attributes: ['id', 'authoritys']
                }
            ]
        });

        if (!userInfo) {
            return res.status(404).json({ 
                code: 404, 
                message: '用户不存在' 
            });
        }

        const { role } = userInfo;
        if (!role) {
            return res.status(401).json({ 
                code: 401, 
                message: '用户角色不存在' 
            });
        }

        // 获取角色的权限列表
        const authorities = role.authoritys.split(',');

        // 根据权限过滤菜单
        const filteredNav = filterNav(nav, authorities);

        // 对菜单数据进行签名
        const signedData = signData({
            menu: filteredNav,
            user: {
                id: userInfo.id,
                username: userInfo.username,
                roleId: userInfo.roleId
            }
        });

        // 更新缓存
        menuCache.set(cacheKey, {
            data: signedData,
            timestamp: Date.now()
        });

        // 返回签名后的数据
        res.json({
            code: 200,
            data: signedData
        });

    } catch (error) {
        console.error('获取角色权限错误:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                code: 401, 
                message: '无效的访问令牌' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                code: 401, 
                message: '访问令牌已过期' 
            });
        }
        res.status(500).json({ 
            code: 500, 
            message: '服务器内部错误' 
        });
    }
});

// 新增角色
router.post('/addRole', async (req, res) => {
    try {
        const { role_name, authoritys, description } = req.body;
        
        // 验证必填字段
        if (!role_name || !authoritys) {
            return res.json({
                code: 400,
                message: '角色名称和权限列表为必填项'
            });
        }
        
        // 创建角色
        const role = await Role.create({
            role_name,
            authoritys,
            description: description || ''
        });
        
        res.json({
            code: 200,
            data: role,
            message: '角色添加成功'
        });
    } catch (error) {
        console.error('添加角色错误:', error);
        res.json({
            code: 500,
            message: '添加角色失败: ' + error.message
        });
    }
})

//获取权限树
router.get('/getAuthorityTree', async (req, res) => {
    // 验证用户是否为系统管理员权限
    // const token = req.headers['authorization']?.split(' ')[1];
    // if (!token) {
    //     return res.status(401).send({ code: 401, message: 'Token is missing' });
    // }
    // const { username } = jwt.verify(token, "yyjkn");
    // const userInfo = await user.findOne({
    //     where: { username },
    //     include: [
    //         {
    //             model: Role,
    //             as: 'role', // 假设 user 模型中有关联的 role
    //             attributes: ['id', 'authoritys']
    //         }
    //     ]
    // });
    // if (!userInfo) {
    //     return res.status(404).send({ code: 404, message: 'User not found' });
    // }
    // const { role } = userInfo;
    // if (!role) {
    //     return res.status(401).send({ code: 401, message: 'User role does not exist' });
    // }
    // if(role.role_name!== '系统管理员'){
    //     return res.status(401).send({ code: 401, message: 'User does not have permission' });
    // }

    try{
        res.send({
            code:200,
            data:nav
        })
    }catch(error){
        res.status(500).send({ code: 500, message: 'Internal Server Error' });
    }
})


//获取角色列表（支持分页和角色名称查询）
router.get('/getRoleList', async (req, res) => {
    try {
        // 获取查询参数，设置默认值
        const { page = 1, size = 10, role_name } = req.query;
        
        // 转换为整数
        const pageInt = parseInt(page, 10);
        const sizeInt = parseInt(size, 10);
        
        // 构建查询条件
        const where = {};
        if (role_name) {
            where.role_name = {
                [Op.like]: `%${role_name}%`
            };
        }
        
        // 执行分页查询
        const { count, rows } = await Role.findAndCountAll({
            where,
            offset: (pageInt - 1) * sizeInt,
            limit: sizeInt,
            order: [['id', 'ASC']]
        });
        
        // 返回结果
        res.json({
            code: 200,
            data: {
                total: count,
                items: rows,
                page: pageInt,
                size: sizeInt
            },
            message: '获取角色列表成功'
        });
    } catch (error) {
        console.error('获取角色列表错误:', error);
        res.json({
            code: 500,
            message: '获取角色列表失败: ' + error.message
        });
    }
})

//更新某个角色下的权限
router.post('/updateRoleAuthority', async (req, res) => {
    try {
        const { id, authoritys } = req.body;
        
        // 验证必填字段
        if (!id || !authoritys) {
            return res.json({
                code: 400,
                message: '角色ID和权限列表为必填项'
            });
        }
        
        // 检查角色是否存在
        const roleExists = await Role.findByPk(id);
        if (!roleExists) {
            return res.json({
                code: 404,
                message: '角色不存在'
            });
        }
        
        // 更新角色权限
        await Role.update({ authoritys }, { where: { id } });
        
        // 获取更新后的角色信息
        const updatedRole = await Role.findByPk(id);
        
        res.json({
            code: 200,
            data: updatedRole,
            message: '角色权限更新成功'
        });
    } catch (error) {
        console.error('更新角色权限错误:', error);
        res.json({
            code: 500,
            message: '更新角色权限失败: ' + error.message
        });
    }
})



module.exports = router