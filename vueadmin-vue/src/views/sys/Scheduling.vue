<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="$router.push('/sys/shift-management')">
        班次管理
      </el-button>
    </div>

    <el-card class="calendar-card">
      <template #header>
        <div class="card-header">
          <span>{{ currentYear }}年{{ currentMonth + 1 }}月排班表</span>
          <div class="header-controls">
            <el-select v-model="selectedDepartment" placeholder="选择部门" @change="getEmployeesByDepartment">
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="scheduleData" border style="width: 100%">
        <el-table-column 
          type="index" 
          label="序号" 
          width="60" 
          align="center"
          fixed="left"
        />
        <el-table-column 
          prop="employeeName" 
          label="员工姓名" 
          width="120" 
          align="center"
          fixed="left"
        />
        <el-table-column
          v-for="day in daysInMonth"
          :key="day"
          :label="formatDate(day)"
          align="center"
          width="120"
        >
          <template #default="scope">
            <el-popover
              placement="top"
              width="200"
              trigger="click"
            >
              <template #reference>
                <div class="shift-cell" :class="getShiftClass(scope.row['day' + day])">
                  <template v-if="scope.row['day' + day]">
                    <div class="shift-name">{{ scope.row['day' + day].name }}</div>
                  </template>
                  <template v-else>
                    <div class="no-shift">未排班</div>
                  </template>
                </div>
              </template>
              
              <div class="shift-selector">
                <el-radio-group 
                  v-model="selectedShift"
                  @change="(val) => assignShift(scope.row.employeeId, day, val)"
                >
                  <el-radio 
                    v-for="shift in shifts"
                    :key="shift.id"
                    :label="shift.id"
                  >
                    {{ shift.name }}
                  </el-radio>
                </el-radio-group>
                <el-button 
                  type="danger" 
                  size="small"
                  @click="removeShift(scope.row.employeeId, day)"
                >
                  清除排班
                </el-button>
              </div>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getDepartments, getShifts, getSchedulesByDepartment, assignShift, removeShift } from '@/api/scheduling'

export default {
  name: 'Scheduling',
  
  data() {
    return {
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      departments: [],
      selectedDepartment: null,
      shifts: [],
      selectedShift: '',
      scheduleData: []
    }
  },

  computed: {
    daysInMonth() {
      return new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
    }
  },

  created() {
    this.getDepartments()
    this.getShifts()
  },

  methods: {
    formatDate(day) {
      const date = new Date(this.currentYear, this.currentMonth, day)
      const weekDays = ['日', '一', '二', '三', '四', '五', '六']
      return `${day}日\n周${weekDays[date.getDay()]}`
    },

    getDepartments() {
      getDepartments().then(res => {
        if (res.code === 200) {
          this.departments = res.data
        }
      })
    },

    getShifts() {
      getShifts().then(res => {
        if (res.code === 200) {
          this.shifts = res.data
        }
      })
    },

    getEmployeesByDepartment(departmentId) {
      if (!departmentId) return
      
      getSchedulesByDepartment(departmentId).then(res => {
        if (res.code === 200) {
          this.scheduleData = res.data.map(employee => {
            const rowData = {
              employeeId: employee.id,
              employeeName: employee.name
            }
            
            // 为每一天创建数据列
            employee.schedules.forEach(schedule => {
              const day = parseInt(schedule.date.split('-')[2])
              rowData['day' + day] = schedule.shift
            })
            
            return rowData
          })
        }
      })
    },

    assignShift(employeeId, day, shiftId) {
      const date = new Date(this.currentYear, this.currentMonth, day)
      
      assignShift({
        employeeId,
        shiftId,
        date: date.toISOString().split('T')[0]
      }).then(res => {
        if (res.code === 200) {
          this.$message.success('排班成功')
          this.getEmployeesByDepartment(this.selectedDepartment)
          this.selectedShift = ''
        }
      })
    },

    removeShift(employeeId, day) {
      const date = new Date(this.currentYear, this.currentMonth, day)
      
      removeShift({
        employeeId,
        date: date.toISOString().split('T')[0]
      }).then(res => {
        if (res.code === 200) {
          this.$message.success('清除排班成功')
          this.getEmployeesByDepartment(this.selectedDepartment)
        }
      })
    },

    getShiftClass(shift) {
      if (!shift) return 'no-shift'
      const types = ['', 'success', 'warning', 'danger']
      return `shift-${types[shift.id % types.length]}`
    }
  }
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}

.calendar-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 16px;
}

.shift-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.shift-selector .el-radio {
  margin-bottom: 8px;
  display: block;
}

.shift-cell {
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  min-height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.shift-name {
  font-weight: bold;
}

.no-shift {
  color: #909399;
}

.shift-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.shift-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.shift-danger {
  background-color: #fef0f0;
  color: #f56c6c;
}

:deep(.el-table .cell) {
  padding: 4px;
}
</style>