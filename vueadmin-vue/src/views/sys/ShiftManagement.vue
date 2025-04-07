<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="dialogVisible = true">新增班次</el-button>
    </div>

    <el-table :data="shifts" border style="width: 100%">
      <el-table-column prop="name" label="班次名称" width="180" />
      <el-table-column label="周排班设置" min-width="600">
        <template #default="scope">
          <div class="week-schedule">
            <div v-for="(day, index) in scope.row.weekSchedule" :key="index" class="day-schedule">
              <span class="day-label">{{ weekDays[index] }}</span>
              <template v-if="day.enabled">
                <div class="time-range">
                  {{ formatTime(day.startTime) }} - {{ formatTime(day.endTime) }}
                </div>
              </template>
              <template v-else>
                <div class="time-range disabled">休息</div>
              </template>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" @click="editShift(scope.row)">编辑</el-button>
          <el-button type="danger" @click="deleteShift(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog 
      :visible.sync="dialogVisible"
      :title="form.id ? '编辑班次' : '新增班次'"
      width="800px"
    >
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="班次名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入班次名称" />
        </el-form-item>
        
        <el-form-item label="周排班设置">
          <div class="week-schedule-form">
            <div v-for="(day, index) in form.weekSchedule" :key="index" class="day-form">
              <div class="day-header">
                <span>{{ weekDays[index] }}</span>
                <el-switch v-model="day.enabled" />
              </div>
              <template v-if="day.enabled">
                <el-time-picker 
                  v-model="day.startTime"
                  format="HH:mm"
                  placeholder="开始时间"
                  :disabled="!day.enabled"
                />
                <el-time-picker 
                  v-model="day.endTime"
                  format="HH:mm"
                  placeholder="结束时间"
                  :disabled="!day.enabled"
                />
              </template>
            </div>
          </div>
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
import { getShifts, createShift, updateShift, deleteShift } from '@/api/scheduling'

export default {
  name: 'ShiftManagement',

  data() {
    return {
      shifts: [],
      dialogVisible: false,
      weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      form: {
        id: '',
        name: '',
        description: '',
        weekSchedule: Array(7).fill(null).map(() => ({
          enabled: false,
          startTime: '',
          endTime: ''
        }))
      },
      rules: {
        name: [
          { required: true, message: '请输入班次名称', trigger: 'blur' }
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
      return time.substring(0, 5)
    },

    getShifts() {
      getShifts().then(res => {
        if (res.code === 200) {
          this.shifts = res.data
        }
      })
    },

    editShift(shift) {
      this.form = {
        ...shift,
        weekSchedule: shift.weekSchedule || Array(7).fill(null).map(() => ({
          enabled: false,
          startTime: '',
          endTime: ''
        }))
      }
      this.dialogVisible = true
    },

    deleteShift(id) {
      this.$confirm('确认删除该班次吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteShift(id).then(res => {
          if (res.code === 200) {
            this.$message.success('删除成功')
            this.getShifts()
          }
        })
      })
    },

    submitForm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          const url = this.form.id ? updateShift : createShift
          url(this.form).then(res => {
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
        description: '',
        weekSchedule: Array(7).fill(null).map(() => ({
          enabled: false,
          startTime: '',
          endTime: ''
        }))
      }
      this.$refs.formRef.resetFields()
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

.week-schedule {
  display: flex;
  gap: 12px;
}

.day-schedule {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.day-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.time-range {
  font-size: 12px;
  color: #606266;
}

.time-range.disabled {
  color: #909399;
}

.week-schedule-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.day-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  min-width: 200px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.day-form .el-time-picker {
  width: 100%;
}
</style>
