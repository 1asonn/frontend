<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">供应商管理</h2>
        <div class="header-info">
          <el-tag type="info" size="small">共 {{ total }} 条记录</el-tag>
          <span class="last-update">最后更新时间: {{ new Date().toLocaleString() }}</span>
        </div>
      </div>
      <div class="header-actions">
        <el-tooltip content="刷新数据" placement="top">
          <el-button type="info" icon="el-icon-refresh" circle @click="getList"></el-button>
        </el-tooltip>
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新增供应商
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.name"
        placeholder="供应商名称"
        clearable
        class="filter-item"
        style="width: 210px"
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
      >
        <i slot="prefix" class="el-input__icon el-icon-s-shop"></i>
      </el-input>
      
      <el-input
        v-model="listQuery.contact_person"
        placeholder="联系人"
        clearable
        class="filter-item"
        style="width: 200px; margin-left: 10px"
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
      >
        <i slot="prefix" class="el-input__icon el-icon-user"></i>
      </el-input>
      
      <el-button
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        搜索
      </el-button>
      
      <el-button
        class="filter-item"
        plain
        icon="el-icon-refresh"
        @click="resetQuery"
      >
        重置
      </el-button>
    </div>

    <!-- 供应商列表 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      :row-class-name="tableRowClassName"
    >
      <el-table-column label="#" type="index" width="60" align="center" />
      <el-table-column label="供应商名称" min-width="180">
        <template slot-scope="{row}">
          <el-tag size="medium" effect="plain" type="primary">
            <i class="el-icon-s-shop"></i>
            <span style="margin-left: 5px">{{ row.name }}</span>
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="联系人" width="120" align="center">
        <template slot-scope="{row}">
          <el-tag size="small" effect="plain" type="info" v-if="row.contact_person">
            <i class="el-icon-user"></i> {{ row.contact_person }}
          </el-tag>
          <span class="unset-text" v-else>未设置</span>
        </template>
      </el-table-column>
      <el-table-column label="联系电话" width="150" align="center">
        <template slot-scope="{row}">
          <span v-if="row.contact_phone">{{ row.contact_phone }}</span>
          <span class="unset-text" v-else>未设置</span>
        </template>
      </el-table-column>
      <el-table-column label="地址" min-width="200" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.address">{{ row.address }}</span>
          <span class="unset-text" v-else>未设置</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="180" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span v-if="row.notes">{{ row.notes }}</span>
          <span class="unset-text" v-else>无</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170" align="center">
        <template slot-scope="{row}">
          <i class="el-icon-time" style="margin-right: 5px"></i>
          <span>{{ formatDate(row.createdAt || row.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button
            size="mini"
            type="primary"
            icon="el-icon-edit"
            @click="handleUpdate(row)"
          >
            编辑
          </el-button>
          
          <el-popconfirm 
            title="确定要删除此供应商吗？此操作不可逆!" 
            @confirm="handleDelete(row)"
            :icon="'el-icon-warning-outline'"
            icon-color="red"
          >
            <el-button slot="reference" size="mini" type="danger" icon="el-icon-delete">
              删除
            </el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-divider content-position="center">
        <i class="el-icon-edit"></i> {{ dialogTitle === '新增供应商' ? '填写供应商信息' : '编辑供应商信息' }}
      </el-divider>
      
      <el-form
        ref="dataForm"
        :model="temp"
        :rules="rules"
        label-width="100px"
        status-icon
        class="supplier-form"
      >
        <el-form-item label="供应商名称" prop="name">
          <el-input 
            v-model="temp.name" 
            placeholder="请输入供应商名称"
            prefix-icon="el-icon-s-shop"
          />
        </el-form-item>
        
        <el-form-item label="联系人" prop="contact_person">
          <el-input 
            v-model="temp.contact_person" 
            placeholder="请输入联系人姓名"
            prefix-icon="el-icon-user"
          />
        </el-form-item>
        
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input 
            v-model="temp.contact_phone" 
            placeholder="请输入联系电话"
            prefix-icon="el-icon-phone"
          />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input 
            v-model="temp.address" 
            placeholder="请输入地址"
            prefix-icon="el-icon-location"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="temp.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            resize="none"
          />
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button plain @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          <i class="el-icon-check"></i> 确 定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getSupplierList, getSupplierById, createSupplier, updateSupplier, deleteSupplier } from '@/api/supplier'
import Pagination from '@/components/Pagination'

export default {
  name: 'Supplier',
  components: { Pagination },
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      submitLoading: false,

      // 查询参数
      listQuery: {
        current: 1,
        size: 10,
        name: '',
        contact_person: ''
      },

      // 对话框相关
      dialogVisible: false,
      dialogTitle: '',

      // 表单数据
      temp: {
        id: undefined,
        name: '',
        contact_person: '',
        contact_phone: '',
        address: '',
        notes: ''
      },

      // 验证规则
      rules: {
        name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
        contact_person: [{ required: false, message: '请输入联系人', trigger: 'blur' }],
        contact_phone: [
          { required: false, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$|^\d{3,4}-\d{7,8}$/, message: '请输入正确的电话号码', trigger: 'blur' }
        ],
        address: [{ required: false, message: '请输入地址', trigger: 'blur' }],
        notes: [{ required: false, message: '请输入备注信息', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    // 获取列表
    async getList() {
      this.listLoading = true
      try {
        // 构建查询参数
        const queryParams = {
          current: this.listQuery.current,
          size: this.listQuery.size
        }
        
        // 只在有值时添加搜索条件
        if (this.listQuery.name) {
          queryParams.name = this.listQuery.name
        }
        
        if (this.listQuery.contact_person) {
          queryParams.contact_person = this.listQuery.contact_person
        }
        
        const response = await getSupplierList(queryParams)
        if (response.data && response.data.code === 200) {
          this.list = response.data.data.records || []
          this.total = response.data.data.total || 0
          console.log('获取供应商列表成功:', this.list)
        } else {
          this.$message.error(response.data?.message || '获取供应商列表失败')
          this.list = []
          this.total = 0
        }
      } catch (error) {
        console.error('获取供应商列表失败:', error)
        this.$message.error('获取供应商列表失败')
        this.list = []
        this.total = 0
      }
      this.listLoading = false
    },

    // 过滤器相关方法
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    // 新增供应商
    handleCreate() {
      this.dialogTitle = '新增供应商'
      this.resetForm()
      this.dialogVisible = true
    },

    // 编辑供应商
    handleUpdate(row) {
      this.dialogTitle = '编辑供应商'
      this.temp = { ...row }
      this.dialogVisible = true
    },

    // 重置表单
    resetForm() {
      this.temp = {
        id: undefined,
        name: '',
        contact_person: '',
        contact_phone: '',
        address: '',
        notes: ''
      }
      this.$refs['dataForm'] && this.$refs['dataForm'].resetFields()
    },
    
    // 重置查询条件
    resetQuery() {
      this.listQuery = {
        current: 1,
        size: 10,
        name: '',
        contact_person: ''
      }
      this.getList()
    },

    // 提交表单
    submitForm() {
      this.$refs['dataForm'].validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            // 构建提交的数据
            const supplierData = {
              name: this.temp.name,
              contact_person: this.temp.contact_person || '',
              contact_phone: this.temp.contact_phone || '',
              address: this.temp.address || '',
              notes: this.temp.notes || ''
            }

            if (this.temp.id) {
              // 更新供应商
              response = await updateSupplier(this.temp.id, supplierData)
              if (response.data && response.data.code === 200) {
                this.$message.success('供应商更新成功')
              } else {
                throw new Error(response.data?.message || '供应商更新失败')
              }
            } else {
              // 新建供应商
              response = await createSupplier(supplierData)
              if (response.data && response.data.code === 200) {
                this.$message.success('供应商创建成功')
              } else {
                throw new Error(response.data?.message || '供应商创建失败')
              }
            }
            this.dialogVisible = false
            this.getList() // 刷新供应商列表
          } catch (error) {
            console.error('保存供应商失败:', error)
            this.$message.error(error.message || '保存供应商失败')
          }
          this.submitLoading = false
        }
      })
    },

    // 修改状态
    async handleStatusChange(row) {
      const newStatus = row.status === 'active' ? 'inactive' : 'active'
      const statusText = newStatus === 'active' ? '启用' : '停用'
      
      try {
        await this.$confirm(`确认要${statusText}该供应商吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 使用updateSupplier替代changeSupplierStatus
        await updateSupplier(row.id, { status: newStatus })
        this.$message.success(`${statusText}成功`)
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('修改供应商状态失败:', error)
          this.$message.error('修改供应商状态失败')
        }
      }
    },
    
    // 删除供应商
    async handleDelete(row) {
      try {        
        const response = await deleteSupplier(row.id)
        if (response.data && response.data.code === 200) {
          this.$message.success('删除供应商成功')
          this.getList()
        } else {
          throw new Error(response.data?.message || '删除供应商失败')
        }
      } catch (error) {
        console.error('删除供应商失败:', error)
        this.$message.error(error.message || '删除供应商失败')
      }
    },
    
    // 设置表格行的类名
    tableRowClassName({row, rowIndex}) {
      return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  overflow-y: auto;
}

/* 页面布局 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: #fff;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border-left: 4px solid #409EFF;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header-info {
  display: flex;
  align-items: center;
  margin-top: 8px;
  
  .el-tag {
    margin-right: 10px;
  }
  
  .last-update {
    font-size: 12px;
    color: #909399;
  }
}

.header-actions {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  display: flex;
  align-items: center;
  
  &:before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 18px;
    background-color: #409EFF;
    margin-right: 10px;
    border-radius: 2px;
  }
}

/* 过滤器 */
.filter-container {
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f8f8f9;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 表格样式 */
.el-table {
  margin-top: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
  
  ::v-deep .row-even {
    background-color: #fafafa;
  }
  
  ::v-deep .user-info {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  ::v-deep .unset-text {
    color: #909399;
    font-style: italic;
  }
  
  ::v-deep .el-tag {
    border-radius: 4px;
  }
}

/* 供应商表单样式 */
.supplier-form {
  margin-top: 15px;
  
  .el-input, .el-select {
    width: 100%;
  }
  
  .el-textarea__inner {
    font-family: inherit;
  }
}

/* 对话框样式 */
.el-dialog {
  ::v-deep .el-dialog__title {
    font-weight: 600;
    color: #303133;
  }
  
  ::v-deep .el-dialog__body {
    padding: 20px 30px;
  }
  
  ::v-deep .el-form-item {
    margin-bottom: 22px;
  }
  
  ::v-deep .dialog-footer {
    text-align: right;
    padding-top: 10px;
  }
}

/* 动画效果 */
.el-table, .filter-container, .page-header {
  transition: all 0.3s ease;
}

/* 按钮间距 */
.el-button + .el-button {
  margin-left: 8px;
}
</style> 