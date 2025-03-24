const { sequelize, Sequelize } = require("../init.js")

const Medicine = sequelize.define('medicine',{
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '药品ID'
    },
    name:{
        type: Sequelize.STRING(100),
        validate: {
            notEmpty: true
        },
        comment: '药品名称'
    },
    specification:{
        type: Sequelize.STRING(100),
        validate: {
            notEmpty: true
        },
        comment: '规格'
    },
    manufacturer:{
        type: Sequelize.STRING(200),
        validate: {
            notEmpty: true
        },
        comment: '生产厂家'
    },
    unit:{
        type: Sequelize.STRING(20),
        validate: {
            notEmpty: true
        },
        comment: '单位'
    },
    category:{
        type: Sequelize.STRING(50),
        validate: {
            notEmpty: true
        },
        comment: '药品类别'
    },
    description:{
        type: Sequelize.TEXT,
        comment: '药品描述'
    },
    stock_threshold:{
        type: Sequelize.INTEGER,
        defaultValue: 100,
        comment: '库存预警阈值'
    },
    created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: '创建时间'
    },
    updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: '更新时间'
    }
},{
    tableName: 'medicines',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})

Medicine.sync().then(() =>{
    console.log('medicine表模型已同步!')
})

module.exports = Medicine;
