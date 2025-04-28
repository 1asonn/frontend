const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const md5 = require('js-md5');
const { User, Role, Department } = require('../database/models');
const { Op } = require('sequelize');
const smsCodeStore = require('../utils/smsCodeStore');
const smsService = require('../utils/smsService');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'yyjkn';
const JWT_EXPIRES_IN = '24h';

// 密码加密配置
const BCRYPT_ROUNDS = 12;

// 统一响应格式
const createResponse = (success, message, data = null) => {
    return {
        success,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

// 参数验证中间件
const validateLoginInput = (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json(createResponse(false, '用户名和密码不能为空'));
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json(createResponse(false, '无效的输入格式'));
    }
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json(createResponse(false, '用户名长度必须在3-20个字符之间'));
    }
    if (password.length < 6) {
        return res.status(400).json(createResponse(false, '密码长度不能小于6个字符'));
    }
    next();
};

// 注册功能
const router = express.Router();
router.post('/register', validateLoginInput, async (req, res) => {
    try {
        const { 
            username, 
            password, 
            realname,
            gender,
            birthDate,
            address,
            roleId,
            departmentId 
        } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json(createResponse(false, '用户名已存在'));
        }

        // 检查角色是否存在
        // 确保roleId是整数类型
        const roleIdInt = parseInt(roleId, 10);
        if (isNaN(roleIdInt)) {
            return res.status(400).json(createResponse(false, '无效的角色ID格式'));
        }
        
        const role = await Role.findByPk(roleIdInt);
        if (!role) {
            console.log(`未找到角色ID: ${roleIdInt}`);
            return res.status(400).json(createResponse(false, '指定的角色不存在'));
        }

        // 检查部门是否存在
        const department = await Department.findByPk(departmentId);
        if (!department) {
            return res.status(400).json(createResponse(false, '指定的部门不存在'));
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        
        // 创建用户
        const user = await User.create({
            username,
            password: hashedPassword,
            realname,
            gender,
            birth_date: birthDate,
            address,
            role_id: roleId,
            department_id: departmentId
        });

        res.status(201).json(createResponse(true, '注册成功', { 
            id: user.id,
            username: user.username,
            realname: user.realname
        }));
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 登录功能
router.post('/login', validateLoginInput, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 查找用户
        const user = await User.findOne({
            where: { username },
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'role_name', 'authoritys']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ]
        });

        // 用户名或密码错误（不指明具体是哪个错误）
        if (!user) {
            return res.status(401).json(createResponse(false, '用户名或密码错误'));
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(createResponse(false, '用户名或密码错误'));
        }

        // 生成JWT Token
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                roleId: user.role_id,
                departmentId: user.department_id,
                authorities: user.role.authoritys
            },
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN
            }
        );

        // 返回用户信息和token
        res.status(200).json(createResponse(true, '登录成功', {
            token,
            user: {
                id: user.id,
                username: user.username,
                realname: user.realname,
                role: user.role,
                department: user.department
            }
        }));
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 获取用户列表
router.get('/getUserList', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ').pop();
        if (!token) {
            return res.status(401).json(createResponse(false, 'token为空!'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const authorities = decoded.authorities.split(',');
        
        if (!authorities.includes("SysUser")) {
            return res.status(403).json(createResponse(false, '用户无权限'));
        }

        // 读取分页和筛选参数
        let { current = 1, size = 10, username = '' } = req.query;
        current = parseInt(current, 10) || 1;
        size = parseInt(size, 10) || 10;
        const offset = (current - 1) * size;
        const where = {};
        if (username && username.trim() !== '') {
            where.realname = { [Op.like]: `%${username.trim()}%` };
        }

        // findAndCountAll 支持分页和条件筛选
        const result = await User.findAndCountAll({
            where,
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'role_name', 'authoritys']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ],
            attributes: {
                exclude: ['password']
            },
            limit: size,
            offset,
            order: [['id', 'ASC']]
        });

        // 直接使用原始数据，不进行脱敏处理
        res.json(createResponse(true, '获取用户列表成功', {
            records: result.rows,
            size,
            current,
            total: result.count
        }));
    } catch (error) {
        console.error('获取用户列表错误:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json(createResponse(false, '无效的token'));
        }
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 获取用户信息
router.get('/getUserInfo/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ').pop();
        
        if (!token) {
            return res.status(401).json(createResponse(false, 'token为空!'));
        }

        const user = await User.findOne({
            where: { id },
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'role_name', 'authoritys']
                },
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name']
                }
            ],
            attributes: { 
                exclude: ['password'] // 排除密码字段
            }
        });

        if (!user) {
            return res.status(404).json(createResponse(false, '用户不存在'));
        }

        // 创建用户对象的副本，添加脱敏的手机号码
        const userData = user.toJSON();
        userData.maskedPhone = user.getMaskedPhone();

        res.json(createResponse(true, '获取用户信息成功', userData));
    } catch (error) {
        console.error('获取用户信息错误:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json(createResponse(false, '无效的token'));
        }
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 更新用户信息
router.put('/updateUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization?.split(' ').pop();
        
        if (!token) {
            return res.status(401).json(createResponse(false, 'token为空!'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const authorities = decoded.authorities.split(',');
        
        if (!authorities.includes("SysUser")) {
            return res.status(403).json(createResponse(false, '用户无权限'));
        }

        const {
            realname,
            gender,
            birthDate,
            address,
            roleId,
            departmentId
        } = req.body;

        // 检查用户是否存在
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json(createResponse(false, '用户不存在'));
        }

        // 如果要更新角色，检查角色是否存在
        if (roleId) {
            const role = await Role.findByPk(roleId);
            if (!role) {
                return res.status(400).json(createResponse(false, '指定的角色不存在'));
            }
        }
        
        // 如果要更新部门，检查部门是否存在
        if (departmentId) {
            const department = await Department.findByPk(departmentId);
            if (!department) {
                return res.status(400).json(createResponse(false, '指定的部门不存在'));
            }
        }

        // 更新用户信息
        await user.update({
            realname,
            gender,
            birth_date: birthDate,
            address,
            role_id: roleId,
            department_id: departmentId
        });

        res.json(createResponse(true, '更新用户信息成功'));
    } catch (error) {
        console.error('更新用户信息错误:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json(createResponse(false, '无效的token'));
        }
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 根据账户名获取绑定的手机号码
router.get('/getPhoneByUsername/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json(createResponse(false, '用户不存在'));
        }
        // 返回脱敏的手机号码
        res.json(createResponse(true, '获取手机号码成功', user.getMaskedPhone()));
    } catch (error) {
        console.error('获取手机号码错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 发送重置密码的短信验证码
router.post('/sendResetPasswordCode', async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json(createResponse(false, '手机号码不能为空'));
        }
        
        // 查找该手机号码对应的用户
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return res.status(404).json(createResponse(false, '该手机号码未绑定任何用户'));
        }
        
        // 生成4位验证码
        const code = smsCodeStore.generateCode(4);
        
        // 保存验证码
        smsCodeStore.saveCode(phone, code);
        
        // 发送短信
        const result = await smsService.sendSms(phone, code);
        
        if (result.success) {
            res.json(createResponse(true, '验证码发送成功'));
        } else {
            res.status(500).json(createResponse(false, '验证码发送失败: ' + result.message));
        }
    } catch (error) {
        console.error('发送验证码错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 通过短信验证码重置密码
router.post('/resetPasswordBySms', async (req, res) => {
    try {
        const { phone, code, newPassword } = req.body;
        
        // 验证参数
        if (!phone || !code || !newPassword) {
            return res.status(400).json(createResponse(false, '手机号码、验证码和新密码不能为空'));
        }
        
        // 验证密码长度
        if (newPassword.length < 6) {
            return res.status(400).json(createResponse(false, '密码长度不能小于6个字符'));
        }
        
        // 验证验证码
        const verifyResult = smsCodeStore.verifyCode(phone, code);
        if (!verifyResult.valid) {
            return res.status(400).json(createResponse(false, verifyResult.message));
        }
        
        // 查找用户
        const user = await User.findOne({ where: { phone } });
        if (!user) {
            return res.status(404).json(createResponse(false, '用户不存在'));
        }
        
        // 加密新密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // 更新密码
        await user.update({ password: hashedPassword });
        
        res.json(createResponse(true, '密码重置成功'));
    } catch (error) {
        console.error('重置密码错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

module.exports = router