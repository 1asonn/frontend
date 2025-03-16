const express = require('express');
const User = require('../database/models/User')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Role = require('../database/models/Role')
router.get('/test',(req,res) => {
    res.send({msg:'test'})
})


// 注册功能
router.post('/register', async (req,res) => {
    const {username,password,authority} = req.body
    const model = await User.findOne({where:{username}})
    if(model){
        return res.send({msg:'用户名已存在'})
    }
    //用户密码加密
    const user = await User.create({username,password:bcrypt.hashSync(password,5),authority})
    res.send({msg:"注册成功!"})
})

//登录功能
router.post('/login',async (req,res) => {
    const {username,password} = req.body
    
    //根据用户名在数据库中检索
    const model = await User.findOne({where:{username}})
    //用户不存在
    if(!model){
        return res.send({msg:"用户不存在,请联系管理员!"})
    }
    
    //比较用户输入的密码与数据库中的密码
    const passwordValid = bcrypt.compareSync(password,model.dataValues.password)
    //密码校验不通过
    if(!passwordValid){
        return res.send({msg:"密码错误!"})
    }

    //生成token返回给浏览器
    //生成token
    const token = jwt.sign({username},"yyjkn")
    const code = 200
    res.send({code,token})
})

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
module.exports = router