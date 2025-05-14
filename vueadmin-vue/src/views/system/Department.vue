<template>
  <div class="app-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">部门科室管理</h2>
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
          新增部门
        </el-button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.name"
        placeholder="部门名称"
        clearable
        class="filter-item"
        style="width: 200px"
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
      >
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>
      
      <el-input
        v-model="listQuery.manager"
        placeholder="负责人姓名"
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
    </div>

    <!-- 部门列表 -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      :row-class-name="tableRowClassName"
    >
      <el-table-column label="#" type="index" width="50" align="center" />
      
      <el-table-column label="部门名称" align="left" min-width="180">
        <template slot-scope="{row}">
          <el-tag size="medium" effect="plain" type="primary">
            <i class="el-icon-office-building"></i>
            <span style="margin-left: 5px">{{ row.name }}</span>
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="部门描述" align="left" min-width="220" show-overflow-tooltip>
        <template slot-scope="{row}">
          <span>{{ row.description || '暂无描述' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="负责人" align="center" width="160">
        <template slot-scope="{row}">
          <el-popover
            v-if="row.manager"
            placement="top-start"
            trigger="hover"
            :width="200"
          >
            <div>
              <p><strong>用户名：</strong> {{ row.manager.username }}</p>
              <p v-if="row.manager.phone"><strong>电话：</strong> {{ row.manager.phone }}</p>
              <p v-if="row.manager.email"><strong>邮箱：</strong> {{ row.manager.email }}</p>
            </div>
            <div slot="reference" class="user-info">
              <el-avatar size="small" icon="el-icon-user">
                {{ row.manager.realname ? row.manager.realname.substring(0, 1) : row.manager.username.substring(0, 1) }}
              </el-avatar>
              <span style="margin-left: 5px">{{ row.manager.realname || row.manager.username }}</span>
            </div>
          </el-popover>
          <span v-else class="unset-text">未设置</span>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" align="center" width="170">
        <template slot-scope="{row}">
          <i class="el-icon-time" style="margin-right: 5px"></i>
          <span>{{ formatDate(row.createdAt) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
        <template slot-scope="{row}">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="handleUpdate(row)">
            编辑
          </el-button>
          
          <el-popconfirm 
            title="确定要删除此部门吗？此操作不可逆!" 
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
        <i class="el-icon-edit"></i> {{ dialogTitle === '新增部门' ? '填写部门信息' : '编辑部门信息' }}
      </el-divider>
      
      <el-form
        ref="dataForm"
        :model="temp"
        :rules="rules"
        label-width="100px"
        status-icon
        class="department-form"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input 
            v-model="temp.name" 
            placeholder="请输入部门名称"
            prefix-icon="el-icon-office-building"
          />
        </el-form-item>
        
        <el-form-item label="部门描述" prop="description">
          <el-input
            v-model="temp.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述信息"
            resize="none"
          />
        </el-form-item>
        
        <el-form-item label="负责人" prop="manager_id">
          <el-select 
            v-model="temp.manager_id" 
            filterable 
            clearable 
            placeholder="请选择负责人"
            style="width: 100%"
          >
            <el-option
              v-for="item in managerOptions"
              :key="item.id"
              :label="item.realname || item.username"
              :value="item.id">
              <div class="manager-option">
                <el-avatar size="small" icon="el-icon-user" class="manager-avatar">
                  {{ (item.realname || item.username).substring(0, 1) }}
                </el-avatar>
                <div class="manager-info">
                  <div class="manager-name">{{ item.realname || item.username }}</div>
                  <div class="manager-username" v-if="item.username && item.realname">{{ item.username }}</div>
                </div>
              </div>
            </el-option>
          </el-select>
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
import { getDepartmentList, getDepartmentById, createDepartment, updateDepartment, deleteDepartment, changeDepartmentStatus } from '@/api/department'
import { getUserList, getAllUsers } from '@/api/user' // 导入新的用户API函数
import Pagination from '@/components/Pagination'

export default {
  name: 'Department',
  components: { Pagination },
  data() {
    return {
      // 列表相关
      list: [],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 10,
        name: '',
        manager: ''
      },

      // 对话框相关
      dialogVisible: false,
      dialogTitle: '',
      submitLoading: false,
      temp: {
        id: undefined,
        parent_id: null,
        name: '',
        code: '',
        manager: '',
        phone: '',
        sort: 0,
        remark: '',
        status: 'active'
      },
      rules: {
        name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
        description: [{ required: false, message: '请输入部门描述', trigger: 'blur' }],
        manager_id: [{ required: false, message: '请选择负责人', trigger: 'change' }]
      },

      // 部门选项
      departmentOptions: [],
      // 负责人选项
      managerOptions: []
    }
  },
  created() {
    this.getList()
    this.fetchDepartmentOptions()
    this.fetchManagerOptions()
  },
  methods: {
    // 获取列表
    async getList() {
      this.listLoading = true
      try {
        // 构建查询参数
        const queryParams = {
          page: this.listQuery.page,
          limit: this.listQuery.limit
        }
        
        // 只在有值时添加部门名称和负责人查询条件
        if (this.listQuery.name) {
          queryParams.name = this.listQuery.name
        }
        
        if (this.listQuery.manager) {
          queryParams.manager = this.listQuery.manager
        }
        
        const response = await getDepartmentList(queryParams)
        if (response.data && response.data.code === 200) {
          // 获取部门数据
          this.list = response.data.data || []
          this.total = this.list.length
          console.log('获取部门列表成功:', this.list)
        } else {
          this.$message.error(response.data.message || '获取部门列表失败')
          this.list = []
          this.total = 0
        }
      } catch (error) {
        console.error('获取部门列表失败:', error)
        this.$message.error('获取部门列表失败')
        this.list = []
        this.total = 0
      }
      this.listLoading = false
    },

    // 获取部门选项
    async fetchDepartmentOptions() {
      try {
        const response = await getDepartmentList({ limit: 1000 })
        if (response.data && response.data.code === 200) {
          // 直接获取数组数据
          const departmentsData = response.data.data || []
          this.departmentOptions = this.formatDepartmentOptions(departmentsData)
          console.log('获取部门选项成功:', this.departmentOptions)
        } else {
          this.$message.error(response.data.message || '获取部门选项失败')
          this.departmentOptions = []
        }
      } catch (error) {
        console.error('获取部门选项失败:', error)
        this.$message.error('获取部门选项失败')
        this.departmentOptions = []
      }
    },

    // 格式化部门选项
    formatDepartmentOptions(items) {
      const options = []
      const map = {}

      // 先创建所有节点的映射
      items.forEach(item => {
        map[item.id] = { ...item, children: [] }
      })

      // 构建树形结构
      items.forEach(item => {
        const node = map[item.id]
        if (item.parent_id) {
          const parent = map[item.parent_id]
          if (parent) {
            parent.children.push(node)
          } else {
            options.push(node)
          }
        } else {
          options.push(node)
        }
      })

      return options
    },
    
    // 获取负责人选项
    async fetchManagerOptions() {
      try {
        // 使用getAllUsers函数获取所有用户信息，或者使用getUserList获取分页数据
        const response = await getUserList({
          page: 1,
          limit: 1000,
          keyword: ''
        })
        console.log('获取用户列表返回数据:', response.data)
        
        // 处理响应数据
        if (response.data && response.data.success === true) {
          // 获取用户数据
          let users = [];
          if (response.data.data.records) {
            // 处理分页格式数据
            users = response.data.data.records;
          } else {
            // 处理直接返回的数组
            users = response.data.data;
          }
          this.managerOptions = users;
          console.log('获取用户列表成功:', this.managerOptions)
        } else {
          console.error('获取用户列表失败:', response.data?.message)
          this.$message.error(response.data?.message || '获取用户列表失败')
          this.managerOptions = []
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
        this.$message.error('获取用户列表失败')
        this.managerOptions = []
      }
    },

    // 过滤器相关方法
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },

    // 新增部门
    handleCreate() {
      this.dialogTitle = '新增部门'
      this.resetForm()
      this.dialogVisible = true
    },

    // 编辑部门
    handleUpdate(row) {
      this.dialogTitle = '编辑部门'
      this.temp = { ...row }
      this.dialogVisible = true
    },

    // 重置表单
    resetForm() {
      this.temp = {
        id: undefined,
        name: '',
        description: '',
        manager_id: null  // 用于选择负责人
      }
      this.$refs['dataForm'] && this.$refs['dataForm'].resetFields()
    },

    // 提交表单
    submitForm() {
      this.$refs['dataForm'].validate(async valid => {
        if (valid) {
          this.submitLoading = true
          try {
            let response
            // 符合后端需要的数据结构
            const departmentData = {
              name: this.temp.name,
              description: this.temp.description || '',
              manager_id: this.temp.manager_id || null
            }

            if (this.temp.id) {
              // 更新部门
              response = await updateDepartment(this.temp.id, departmentData)
              if (response.data && response.data.code === 200) {
                this.$message.success('部门更新成功')
              } else {
                throw new Error(response.data?.message || '部门更新失败')
              }
            } else {
              // 新建部门
              response = await createDepartment(departmentData)
              if (response.data && response.data.code === 200) {
                this.$message.success('部门创建成功')
              } else {
                throw new Error(response.data?.message || '部门创建失败')
              }
            }
            this.dialogVisible = false
            this.getList() // 刷新部门列表
            this.fetchDepartmentOptions() // 刷新部门选项
          } catch (error) {
            console.error('保存部门失败:', error)
            this.$message.error(error.message || '保存部门失败')
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
        await this.$confirm(`确认要${statusText}该部门吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await changeDepartmentStatus(row.id, { status: newStatus })
        this.$message.success(`${statusText}成功`)
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('修改部门状态失败:', error)
          this.$message.error('修改部门状态失败')
        }
      }
    },

    // 删除部门
    async handleDelete(row) {
      try {
        await this.$confirm('确认要删除该部门吗？删除后无法恢复！', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error'
        })
        
        await deleteDepartment(row.id)
        this.$message.success('删除部门成功')
        this.getList()
        this.fetchDepartmentOptions() // 同时刷新部门选项数据
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除部门失败:', error)
          this.$message.error('删除部门失败')
        }
      }
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    
    // 设置表格行的类名
    tableRowClassName({row, rowIndex}) {
      return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
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

/* 部门表单样式 */
.department-form {
  margin-top: 15px;
  
  .el-input, .el-select {
    width: 100%;
  }
  
  .el-textarea__inner {
    font-family: inherit;
  }
}

/* 负责人样式 */
.manager-option {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

.manager-avatar {
  margin-right: 10px;
  background-color: #e6f1fc;
  color: #409EFF;
}

.manager-info {
  display: flex;
  flex-direction: column;
}

.manager-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.manager-username {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
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