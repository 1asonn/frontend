const patient = require('../database/models/Patients')
const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


router.get('/test',(req,res) => {
    res.send({msg:'test'})
})

//新增患者信息
router.post('/addPatients', async (req,res) => {
    const {name, gender, phone,birthday,idCard,medicalId,adress, medicalHistory} = req.body
    const patientModel = await patient.create({name, gender, phone, birthday, idCard, medicalId,adress, medicalHistory})
    if(patientModel){
    res.send({msg: '患者信息添加成功', data: patientModel})}
})


//获取患者信息列表
router.get('/getPatients', async (req,res) => {
    const patients = await patient.findAll()
    res.send({code:200, msg: '获取患者信息列表成功', data: patients})
})

//获取患者信息分页列表
router.get('/getPatientsPage', async (req,res) => {
    const {page, size} = req.query
    const parsedPage = parseInt(page, 10);
    const parsedSize = parseInt(size, 10);
    const offset = (parsedPage - 1) * parsedSize
    const patients = await patient.findAndCountAll({offset, limit: parsedSize})
    res.send({code:200, msg: '获取患者信息列表成功', data: patients})
})

//更新患者信息
router.put('/updatePatients/:id', async (req,res) => {
    const {id} = req.params
    const parsedId = parseInt(id, 10); // 转换为整数
    const {name, gender, phone, birthday, idCard, medicalId, adress, medicalHistory} = req.body
    const patientModel = await patient.update({name, gender, phone, birthday, idCard, medicalId, adress, medicalHistory},{where:{id:parsedId}})
    if(patientModel){
        console.log(patientModel,'=-=-=-=-=')
    res.send({msg: '患者信息更新成功', data: patientModel})}
})

//删除患者信息
router.delete('/deletePatients/:id', async (req,res) => {
    const {id} = req.params
    const parsedId = parseInt(id, 10); // 转换为整数
    const patientModel = await patient.destroy({where:{id:parsedId}})
    if(patientModel){
        res.send({msg: '患者信息删除成功'})
    }
})


module.exports = router