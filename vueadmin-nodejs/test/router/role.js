const express = require('express');
const Role = require('../database/models/Role')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const filterNav = require('../utils/funcs')
const user = require('../database/models/User')
const nav = require('../assets/nav')

router.get('/getRoleAuthorities', async (req, res) => {
    try {
        // 从请求头中获取 token 并解析用户名
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).send({ code: 401, message: 'Token is missing' });
        }

        const { username } = jwt.verify(token, "yyjkn");

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
            return res.status(404).send({ code: 404, message: 'User not found' });
        }

        const { role } = userInfo;
        if (!role) {
            return res.status(401).send({ code: 401, message: 'User role does not exist' });
        }

        // 获取角色的权限列表
        const authorities = role.authoritys.split(',');

        // 根据权限过滤菜单
        const filteredNav = filterNav(nav, authorities);

        res.send({
            code: 200,
            data: filteredNav
        });
    } catch (error) {
        console.error('Error fetching role authorities:', error);
        res.status(500).send({ code: 500, message: 'Internal Server Error' });
    }
});

// 新增角色
router.post('/addRole', async (req, res) => {
    try {
        const { role_name, authoritys } = req.body;
        const role = await Role.create({role_name,authoritys})
        res.send({
            code: 200,
            msg: '角色添加成功'
        })
    }catch(errot){
        console.log(error)
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

module.exports = router