'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建药品交易表
    await queryInterface.createTable('medicine_transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '交易ID'
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '交易单号'
      },
      type: {
        type: Sequelize.ENUM('in', 'out'),
        allowNull: false,
        comment: '交易类型：in-入库，out-出库'
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '供应商ID（入库时使用）'
      },
      supplier_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '供应商名称（入库时使用）'
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '部门ID（出库时使用）'
      },
      department_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '部门名称（出库时使用）'
      },
      entry_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: '交易日期'
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

    // 创建药品交易明细表
    await queryInterface.createTable('medicine_transaction_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '交易明细ID'
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '交易单ID',
        references: {
          model: 'medicine_transactions',
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
        allowNull: true,
        comment: '生产日期'
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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

    // 创建药品库存表
    await queryInterface.createTable('medicine_stocks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '库存ID'
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
      batch_number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '批号'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '当前库存数量'
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '单位'
      },
      specification: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '规格'
      },
      production_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '生产日期'
      },
      expiry_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '有效期至'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '存放位置'
      },
      last_update_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '最后更新时间'
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

    // 创建药品库存历史表
    await queryInterface.createTable('medicine_stock_histories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: '历史记录ID'
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
      batch_number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '批号'
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '关联的交易ID',
        references: {
          model: 'medicine_transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      transaction_code: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '交易单号'
      },
      transaction_type: {
        type: Sequelize.ENUM('in', 'out'),
        allowNull: false,
        comment: '交易类型：in-入库，out-出库'
      },
      quantity_change: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '数量变化（正数表示增加，负数表示减少）'
      },
      quantity_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '变化前数量'
      },
      quantity_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '变化后数量'
      },
      operator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '操作员ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      operator_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '操作员姓名'
      },
      operation_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '操作时间'
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

    // 添加索引
    await queryInterface.addIndex('medicine_transactions', ['code']);
    await queryInterface.addIndex('medicine_transactions', ['type']);
    await queryInterface.addIndex('medicine_transactions', ['supplier_id']);
    await queryInterface.addIndex('medicine_transactions', ['department_id']);
    await queryInterface.addIndex('medicine_transactions', ['status']);
    await queryInterface.addIndex('medicine_transactions', ['entry_date']);
    
    await queryInterface.addIndex('medicine_transaction_items', ['transaction_id']);
    await queryInterface.addIndex('medicine_transaction_items', ['medicine_id']);
    await queryInterface.addIndex('medicine_transaction_items', ['batch_number']);
    
    await queryInterface.addIndex('medicine_stocks', ['medicine_id']);
    await queryInterface.addIndex('medicine_stocks', ['batch_number']);
    await queryInterface.addIndex('medicine_stocks', ['expiry_date']);
    await queryInterface.addIndex('medicine_stocks', ['medicine_id', 'batch_number'], {
      unique: true,
      name: 'medicine_batch_unique'
    });
    
    await queryInterface.addIndex('medicine_stock_histories', ['medicine_id']);
    await queryInterface.addIndex('medicine_stock_histories', ['transaction_id']);
    await queryInterface.addIndex('medicine_stock_histories', ['transaction_type']);
    await queryInterface.addIndex('medicine_stock_histories', ['operation_time']);
  },

  down: async (queryInterface, Sequelize) => {
    // 删除表（按照依赖关系的相反顺序）
    await queryInterface.dropTable('medicine_stock_histories');
    await queryInterface.dropTable('medicine_stocks');
    await queryInterface.dropTable('medicine_transaction_items');
    await queryInterface.dropTable('medicine_transactions');
  }
};
