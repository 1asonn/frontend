const { sequelize, Sequelize } = require('../init.js');

const MaintenanceHistory = sequelize.define('maintenance_history', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '历史记录ID'
    },
    order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '工单ID，关联维修工单表'
    },
    type: {
        type: Sequelize.ENUM('create', 'process', 'update', 'complete', 'cancel'),
        allowNull: false,
        comment: '记录类型：创建、处理、更新、完成、取消'
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '记录标题'
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '记录内容'
    },
    operator: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '操作人'
    },
    time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '操作时间'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'maintenance_history'
});

// 定义关联关系
MaintenanceHistory.associate = (models) => {
    MaintenanceHistory.belongsTo(models.MaintenanceOrder, {
        foreignKey: 'order_id',
        as: 'order'
    });
};

// 使用force: false只创建不存在的表，不修改现有表结构
try {
    MaintenanceHistory.sync({ force: false }).then(() => {
        console.log("维修历史记录表检查完成");
    }).catch(err => {
        console.error("维修历史记录表同步错误，但不影响应用启动:", err.message);
    });
} catch (error) {
    console.error("维修历史记录表同步异常:", error.message);
    console.log("应用将继续启动，但维修历史记录表可能需要手动更新");
}

module.exports = MaintenanceHistory;
