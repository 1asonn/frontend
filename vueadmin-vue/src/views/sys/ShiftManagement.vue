<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="dialogVisible = true">新增班次</el-button>
    </div>

    <el-table :data="shifts.rows" border style="width: 100%">
      <el-table-column prop="name" label="班次名称" width="180" />
      <el-table-column label="时间" width="300">
        <template #default="scope">
          {{ formatTime(scope.row.startTime) }} - {{ formatTime(scope.row.endTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="isEnabled" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.isEnabled ? 'success' : 'info'">
            {{ scope.row.isEnabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" @click="editShift(scope.row)">编辑</el-button>
          <el-button type="danger" @click="deleteShift(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="shifts.count"
      />
    </div>

    <el-dialog 
      :visible.sync="dialogVisible"
      :title="form.id ? '编辑班次' : '新增班次'"
      width="500px"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="班次名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入班次名称" />
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker 
            v-model="form.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="开始时间"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker 
            v-model="form.endTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="结束时间"
          />
        </el-form-item>

        <el-form-item label="状态" prop="isEnabled">
          <el-switch v-model="form.isEnabled" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            placeholder="请输入班次描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
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
      dialogVisible: false,
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
          { required: true, message: '请选择结束时间', trigger: 'change' }
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

    getShifts() {
      GetShifts({
        page: this.page,
        size: this.size
      }).then(res => {
        if (res.code === 200) {
          this.shifts = res.data
        }
      })
    },

    editShift(shift) {
      this.form = {
        ...shift
      }
      this.dialogVisible = true
    },

    deleteShift(id) {
      this.$confirm('确认删除该班次吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        DeleteShift(id).then(res => {
          if (res.code === 200) {
            this.$message.success('删除成功')
            this.getShifts()
          }
        })
      }).catch(() => {})
    },

    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          const apiCall = this.form.id 
            ? UpdateShift(this.form.id, this.form)
            : CreateShift(this.form)
          
          apiCall.then(res => {
            if (res.code === 200) {
              this.$message.success(this.form.id ? '更新成功' : '创建成功')
              this.dialogVisible = false
              this.getShifts()
              this.resetForm()
            }
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
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-time-picker {
  width: 100%;
}
</style>
