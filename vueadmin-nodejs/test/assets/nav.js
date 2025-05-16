const path = require("path");
const { title } = require("process");

let nav = [
    {
        name: 'PatientManager',
        title: '患者信息管理',
        icon: 'el-icon-s-custom',
        path: '/patient',
        component: 'patient/Patient',
        children: [
            {
                name: 'SysPatient',
                title: '病患管理',
                icon: 'el-icon-s-custom',
                path: '/sys/patient',
                component: 'sys/Patient',
                children: []
            },
        ]
    },
    {
        name: 'MedicineManager',
        title: '药品管理',
        icon: 'el-icon-s-goods',
        path: '/medicine',
        component: 'medicine/Medicine',
        children: [
            {
                name: 'MedicineList',
                title: '药品列表',
                icon: 'el-icon-s-goods',
                path: '/medicine/list',
                component: 'medicine/index',
                children: []
            },
            {
                name:'MedicineStock',
                title:'药品库存',
                icon:'el-icon-s-order',
                path:'/medicine/stock',
                component:'medicine/StockList',
            },
            {
                name:'MedicineStockIn',
                title:'药品入库',
                icon:'el-icon-s-order',
                path:'/medicine/stock-in',
                component:'medicine/StockIn',
            },
            {
                name:'MedicineStockOut',
                title:'药品出库',
                icon:'el-icon-s-order',
                path:'/medicine/stock-out',
                component:'medicine/StockOut',
            }
        ]
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
            },
            {
                name:'SysEquipmentMaintenance',
                title:'设备维修',
                icon:'el-icon-s-order',
                path:'/sys/equipment-maintenance',
                component:'sys/MaintenanceOrder',
                children:[]
            }
        ]
    },
    {
        name: 'HRManager',
        title: '人力资源管理',
        icon: 'el-icon-s-custom',
        path: '/hr',
        component: 'hr/HR',
        children: [
            {
                name: 'SysUser',
                title: '用户列表',
                icon: 'el-icon-s-custom',
                path: '/sys/user',
                component: 'sys/User',
                children: []
            },
            {
                name: 'SysRole',
                title: '角色管理',
                icon: 'el-icon-s-custom',
                path:'/sys/role',
                component: 'sys/Role',
                children: []
            },
            {
                name:'SysSchedule',
                title:'排班管理',
                icon:'el-icon-s-custom',
                path:'/sys/schedule',
                component:'sys/Scheduling',
                children:[]
            },
            {
                name:'SysSet',
                title:'班次设置',
                icon:'el-icon-s-custom',
                path:'/sys/set',
                component:'sys/ShiftManagement',
                children:[]
            }
        ]
    },
    {
        name:'BaseData',
        title:'基础资料',
        icon:'el-icon-s-data',
        path:'/data',
        children:[
            {
                name:'SysDepartment',
                title:'部门管理',
                icon:'el-icon-s-custom',
                path:'/system/Department',
                component:'system/Department',
                children:[]
            },
            {
                name:'SysSupplier',
                title:'供应商管理',
                icon:'el-icon-s-order',
                path:'/system/Supplier',
                component:'system/Supplier',
                children:[]
            }
        ]
    },
    {
        name: 'DataManager',
        title: '数据统计与分析',
        icon: 'el-icon-s-data',
        path: '/data',
        component: 'data/Data',
        children: [
            {
                name:'SysSqlAgent',
                title:'SQL智能助手',
                icon: 'el-icon-s-custom',
                path: '/system/SqlAgent',
                component: 'sys/SqlAgent',
                children: []
            },
            {
                name: 'SysAiData',
                title: 'AI报表',
                icon: 'el-icon-s-custom',
                path:'/system/DataAnalysis',
                component: 'system/DataAnalysis',
                children: []
            }
        ]
    }
];

module.exports = nav