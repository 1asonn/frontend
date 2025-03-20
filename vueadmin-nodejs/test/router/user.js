const express = require('express');
const User = require('../database/models/User')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Role = require('../database/models/Role')
const md5 = require('js-md5')
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
router.post('/register', validateLoginInput, async (req, res) => {
    try {
        const { username, password, authority } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json(createResponse(false, '用户名已存在'));
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(md5(password,'0277'), BCRYPT_ROUNDS);
        
        // 创建用户
        const user = await User.create({
            username,
            password: hashedPassword,
            authority
        });

        res.status(201).json(createResponse(true, '注册成功', { username: user.username }));
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
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'authoritys']
            }]
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
                authority: user.authority
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
                authority: user.authority,
                role: user.role
            }
        }));
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json(createResponse(false, '服务器内部错误'));
    }
});

// 权限校验功能
router.post('/auth',async (req,res) => {
    const token = req.headers.authorization.split(' ').pop()
    if(!token){
        return res.send({msg:'token为空!'})
    }
    const {username} = jwt.verify(token,"yyjkn")
    // 查询该用户是否存在
    const model = await User.findOne({where:{username}})
    if(!model){
        return res.send({msg:'用户不存在'})
    }
    res.send({msg:'通过权限校验'})
})

// 获取用户列表
router.get('/getUserList',async (req,res) => {
    const token = req.headers.authorization.split(' ').pop()
    if(!token){
        return res.send({msg:'token为空!'})
    }

    const data = await User.findAll()
    res.send({
        code:200,
        data:data
    })
})

//获取某个用户的信息
router.get('/getUserInfo/:id',async (req,res) => {
    const {id} = req.params
    const token = req.headers.authorization.split(' ').pop()
    if(!token){
        return res.send({msg:'token为空!'})
    }
    const userInfo = await User.findOne({
        where: { id },
        include: [
            {
                model: Role,
                as: 'role', // 假设 user 模型中有关联的 role
                attributes: ['id', 'authoritys']
            }
        ]
    });
    res.send({
        code:200,
        data:userInfo
    })
})

// //更新某个用户的信息
// router.post('/updatedUserInfo' ,async (req,res) => {
//     const {id,authority} = req.body
//     const data = await User.update({authority},{
//         where: { id }
//     })
//     res.send({
//         code:200,
//         msg:'success'
//     })
// })

// 测试接口
router.get('/test',(req,res) => {
    res.send({msg:'test'})
})

module.exports = router