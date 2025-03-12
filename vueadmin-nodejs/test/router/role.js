const express = require('express');
const Role = require('../database/models/Role')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
router.get('/test',(req,res) => {
    res.send({msg:'test'})
})

router.get('/getRoleAuthoritys',(req,res) => {
    let nav = [
        {
            name: 'PatientManager',
            title: '患者信息管理',
            icon: 'el-icon-s-custom',
            path: '/patient',
            component: 'patient/Patient',
            children: [
				{
					name: 'SysUser',
					title: '用户管理',
					icon: 'el-icon-s-custom',
					path: '/sys/users',
					component: 'sys/User',
					children: []
				},
			]
        },
        {
            name: 'HospitalizationManager',
            title: '住院管理',
            icon: 'el-icon-s-home',
            path: '/hospitalization',
            component: 'hospitalization/Hospitalization',
            children: []
        },
        {
            name: 'MedicineManager',
            title: '药品管理',
            icon: 'el-icon-s-goods',
            path: '/medicine',
            component: 'medicine/Medicine',
            children: []
        },
        {
            name: 'EquipmentManager',
            title: '医疗设备管理',
            icon: 'el-icon-s-tools',
            path: '/equipment',
            component: 'equipment/Equipment',
            children: [
				{
					name: 'SysEquipment',
					title: '设备列表',
					icon: 'el-icon-s-custom',
					path: '/sys/equipments',
					component: 'sys/Equipment',
					children: []
				}
			]
        },
        {
            name: 'HRManager',
            title: '人力资源管理',
            icon: 'el-icon-s-custom',
            path: '/hr',
            component: 'hr/HR',
            children: []
        },
        {
            name: 'FinanceManager',
            title: '财务管理',
            icon: 'el-icon-s-finance',
            path: '/finance',
            component: 'finance/Finance',
            children: []
        },
        {
            name: 'DataManager',
            title: '数据统计与分析',
            icon: 'el-icon-s-data',
            path: '/data',
            component: 'data/Data',
            children: []
        },
        {
            name: 'AiManager',
            title: '智慧管理',
            icon: 'el-icon-s-data',
            path: '/ai',
            component: 'ai/Ai',
            children: []
        }
    ];

    
})



module.exports = router