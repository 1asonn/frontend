<template>
  <div>
    <div class="search-area">
      <el-card shadow="hover" class="filter-card">
        <div class="filter-header">
          <i class="el-icon-search"></i>
          <span>搜索条件</span>
        </div>
        <el-form :inline="true" :model="searchForm" size="small">
          <el-form-item>
            <el-input 
              v-model="searchForm.name" 
              placeholder="班次名称" 
              clearable 
              prefix-icon="el-icon-date" 
              @keyup.enter.native="searchShifts"
              @clear="searchShifts">
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-select 
              v-model="searchForm.isEnabled" 
              placeholder="状态" 
              clearable 
              style="width: 120px"
              @change="searchShifts">
              <el-option label="启用" :value="true">
                <span style="float: left"><i class="el-icon-success" style="color: #67C23A; margin-right: 5px"></i>启用</span>
              </el-option>
              <el-option label="禁用" :value="false">
                <span style="float: left"><i class="el-icon-error" style="color: #F56C6C; margin-right: 5px"></i>禁用</span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="searchShifts">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetSearchForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <div class="operation-area">
        <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">新增班次</el-button>
      </div>
    </div>

    <el-card shadow="hover" class="table-card">
      <div slot="header" class="table-header">
        <span><i class="el-icon-time"></i> 班次列表</span>
        <span class="table-total">共 <el-tag size="small" type="info">{{shifts.count}}</el-tag> 条数据</span>
      </div>
      <el-table 
        :data="shifts.rows" 
        border 
        stripe 
        highlight-current-row
        style="width: 100%"
        v-loading="loading">
        <el-table-column prop="name" label="班次名称" min-width="120">
          <template slot-scope="scope">
            <div class="shift-name">
              <i class="el-icon-date" style="margin-right: 5px; color: #409EFF;"></i>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="180" align="center">
          <template slot-scope="scope">
            <el-tag size="medium" effect="plain" type="primary">
              <i class="el-icon-time" style="margin-right: 5px"></i>
              {{ formatTime(scope.row.startTime) }} - {{ formatTime(scope.row.endTime) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="isEnabled" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag size="small" :type="scope.row.isEnabled ? 'success' : 'danger'">
              {{ scope.row.isEnabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="scope">
            <div class="button-group">
              <el-tooltip content="编辑班次" placement="top" :enterable="false">
                <el-button type="warning" size="mini" icon="el-icon-edit" circle @click="editShift(scope.row)"></el-button>
              </el-tooltip>
              
              <el-tooltip content="删除班次" placement="top" :enterable="false">
                <el-popconfirm title="删除后数据无法恢复,确定删除吗？" @confirm="deleteShift(scope.row.id)">
                  <el-button type="danger" size="mini" icon="el-icon-delete" circle slot="reference"></el-button>
                </el-popconfirm>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <template slot="empty">
          <div class="empty-data">
            <i class="el-icon-warning-outline"></i>
            <p>暂无数据</p>
          </div>
        </template>
      </el-table>

    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="shifts.count"
        background
      />
    </div>
    </el-card>

    <el-dialog 
      :visible.sync="dialogVisible"
      :title="form.id ? '编辑班次' : '新增班次'"
      width="550px"
      :before-close="handleDialogClose"
      custom-class="shift-dialog"
      top="5vh"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef" size="small">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="班次名称" prop="name" required>
              <el-input 
                v-model="form.name" 
                placeholder="请输入班次名称" 
                prefix-icon="el-icon-date"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime" required>
              <el-time-picker 
                v-model="form.startTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime" required>
              <el-time-picker 
                v-model="form.endTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="状态" prop="isEnabled">
              <el-switch 
                v-model="form.isEnabled"
                active-text="启用"
                inactive-text="禁用"
                active-color="#13ce66"
                inactive-color="#ff4949"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">班次描述</el-divider>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入班次描述"
          />
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="handleDialogClose" icon="el-icon-close">取消</el-button>
        <el-button type="primary" @click="submitForm" icon="el-icon-check" :loading="submitLoading">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { GetShifts, CreateShift, UpdateShift, DeleteShift } from '@/api/schedule'
export default {
  name: 'ShiftManagement',

  data() {
    return {
      shifts: {
        rows: [],
        count: 0
      },
      page: 1,
      size: 10,
      loading: false,
      submitLoading: false,
      dialogVisible: false,
      searchForm: {
        name: '',
        isEnabled: ''
      },
      form: {
        id: '',
        name: '',
        startTime: '',
        endTime: '',
        description: '',
        isEnabled: true
      },
      rules: {
        name: [
          { required: true, message: '请输入班次名称', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' }
        ],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' },
          { validator: this.validateTimeRange, trigger: 'change' }
        ]
      }
    }
  },

  created() {
    this.getShifts()
  },

  methods: {
    formatTime(time) {
      if (!time) return ''
      return time
    },

    handleSizeChange(val) {
      this.size = val
      this.getShifts()
    },

    handleCurrentChange(val) {
      this.page = val
      this.getShifts()
    },
    
    // 验证结束时间必须晚于开始时间
    validateTimeRange(rule, value, callback) {
      if (this.form.startTime && this.form.endTime) {
        const start = new Date(`2000/01/01 ${this.form.startTime}`)
        const end = new Date(`2000/01/01 ${this.form.endTime}`)
        if (end <= start) {
          callback(new Error('结束时间必须晚于开始时间'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    },

    // 搜索班次
    searchShifts() {
      this.page = 1 // 重置为第一页
      this.getShifts()
    },
    
    // 重置搜索条件
    resetSearchForm() {
      // 重置表单数据
      this.searchForm = {
        name: '',
        isEnabled: ''
      }
      // 重置分页
      this.page = 1
      // 重新加载数据
      this.$nextTick(() => {
        this.getShifts()
      })
      // 提示用户
      this.$message({
        type: 'info',
        message: '已重置搜索条件',
        duration: 1000
      })
    },

    // 打开新增对话框
    openAddDialog() {
      this.resetForm()
      this.dialogVisible = true
    },
    
    // 关闭对话框
    handleDialogClose() {
      this.$confirm('确认关闭？未保存的数据将会丢失', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.dialogVisible = false
        this.resetForm()
      }).catch(() => {})
    },

    getShifts() {
      this.loading = true
      const params = {
        page: this.page,
        size: this.size,
        name: this.searchForm.name,
        isEnabled: this.searchForm.isEnabled
      }
      
      GetShifts(params).then(res => {
        if (res.code === 200) {
          this.shifts = res.data
          
          // 如果没有数据且不是第一页，返回上一页
          if (this.shifts.rows.length === 0 && this.page > 1) {
            this.page--
            this.getShifts()
            return
          }
          
          // 成功获取数据后的提示
          if (this.shifts.rows.length > 0 && this.searchForm.name) {
            this.$message({
              type: 'success',
              message: `找到 ${this.shifts.rows.length} 条符合条件的班次`,
              duration: 1500
            })
          }
        }
      }).finally(() => {
        this.loading = false
      })
    },

    editShift(shift) {
      this.form = {
        ...shift
      }
      this.dialogVisible = true
    },

    deleteShift(id) {
      this.loading = true
      DeleteShift(id).then(res => {
        if (res.code === 200) {
          this.$message({
            type: 'success',
            message: '删除成功',
            duration: 1500
          })
          this.getShifts()
        } else {
          this.$message.error(res.message || '删除失败')
        }
      }).catch(err => {
        console.error('删除班次失败:', err)
        this.$message.error('删除失败: ' + (err.message || '未知错误'))
      }).finally(() => {
        this.loading = false
      })
    },

    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.submitLoading = true
          
          const apiCall = this.form.id 
            ? UpdateShift(this.form.id, this.form)
            : CreateShift(this.form)
          
          apiCall.then(res => {
            if (res.code === 200) {
              this.$message({
                type: 'success',
                message: this.form.id ? '更新班次成功' : '创建班次成功',
                duration: 1500
              })
              this.dialogVisible = false
              this.$nextTick(() => {
                this.resetForm()
              })
              this.getShifts()
            } else {
              this.$message.error(res.message || (this.form.id ? '更新失败' : '创建失败'))
            }
          }).catch(err => {
            console.error(this.form.id ? '更新班次失败:' : '创建班次失败:', err)
            this.$message.error((this.form.id ? '更新失败: ' : '创建失败: ') + (err.message || '未知错误'))
          }).finally(() => {
            this.submitLoading = false
          })
        }
      })
    },

    resetForm() {
      this.form = {
        id: '',
        name: '',
        startTime: '',
        endTime: '',
        description: '',
        isEnabled: true
      }
      // 延迟重置表单，确保DOM已更新
      this.$nextTick(() => {
        if (this.$refs.formRef) {
          this.$refs.formRef.resetFields()
        }
      })
    }
  }
}
</script>

<style scoped>
.search-area {
  text-align: left;
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 15px;
  border-radius: 5px;
}

.filter-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #606266;
}

.filter-header i {
  margin-right: 5px;
  color: #409EFF;
}

.operation-area {
  margin: 15px 0;
}

.operation-area .el-button {
  margin-right: 10px;
}

.table-card {
  margin-bottom: 20px;
  border-radius: 5px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header i {
  margin-right: 5px;
  color: #409EFF;
}

.table-total {
  font-size: 13px;
  color: #606266;
}

.shift-name {
  display: flex;
  align-items: center;
}

.empty-data {
  padding: 30px 0;
  text-align: center;
  color: #909399;
}

.empty-data i {
  font-size: 40px;
  margin-bottom: 10px;
}

.pagination-container {
  text-align: right;
  margin-top: 20px;
  padding: 10px 0;
}

/* 班次对话框样式 */
.shift-dialog .el-dialog__body {
  padding: 20px 30px;
}

.shift-dialog .el-form-item {
  margin-bottom: 18px;
}

.shift-dialog .el-divider__text {
  font-size: 14px;
  font-weight: bold;
  color: #409EFF;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  justify-content: center;
  align-items: center;
}

.button-group .el-button {
  margin: 0 5px;
}

.button-group .el-tooltip {
  display: inline-block;
}

.el-time-picker {
  width: 100%;
}
</style>
