'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建药品入库表
    await queryInterface.createTable('medicine_stock_ins', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '入库单ID'
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '入库单号'
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '供应商ID'
      },
      supplier_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '供应商名称'
      },
      entry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '入库日期'
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '总金额'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '状态：待审核、已审核、已取消'
      },
      operator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '操作员ID'
      },
      operator_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '操作员姓名'
      },
      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '审核人ID'
      },
      approver_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '审核人姓名'
      },
      approve_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '审核时间'
      },
      approve_remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '审核备注'
      },
      cancel_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '取消原因'
      },
      cancel_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '取消时间'
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 创建药品入库明细表
    await queryInterface.createTable('medicine_stock_in_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '入库明细ID'
      },
      stock_in_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '入库单ID',
        references: {
          model: 'medicine_stock_ins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '药品ID',
        references: {
          model: 'medicines',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      medicine_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '药品名称'
      },
      specification: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '规格'
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '单位'
      },
      batch_number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '批号'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '数量'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '单价'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: '金额'
      },
      production_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '生产日期'
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '有效期至'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '存放位置'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    });

    // 添加索引
    await queryInterface.addIndex('medicine_stock_ins', ['code']);
    await queryInterface.addIndex('medicine_stock_ins', ['supplier_id']);
    await queryInterface.addIndex('medicine_stock_ins', ['status']);
    await queryInterface.addIndex('medicine_stock_ins', ['entry_date']);
    await queryInterface.addIndex('medicine_stock_in_items', ['stock_in_id']);
    await queryInterface.addIndex('medicine_stock_in_items', ['medicine_id']);
    await queryInterface.addIndex('medicine_stock_in_items', ['batch_number']);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除表
    await queryInterface.dropTable('medicine_stock_in_items');
    await queryInterface.dropTable('medicine_stock_ins');
  }
};
