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
          <span>部门排班管理</span>
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

      <!-- 员工排班表格 -->
      <el-table :data="scheduleData" border style="width: 100%">
        <el-table-column prop="name" label="员工姓名" width="120" />
        
        <!-- 周一到周日的排班列 -->
        <el-table-column v-for="(day, index) in weekDays" :key="day" :label="day">
          <template #default="scope">
            <div class="shift-cell">
              <el-select 
                v-model="scope.row.schedules[index]" 
                placeholder="选择班次"
                @change="(val) => handleShiftChange(scope.row, index, val)"
              >
                <el-option label="休息" value="rest">
                  <span>休息</span>
                </el-option>
                <el-option
                  v-for="shift in shifts"
                  :key="shift.id"
                  :label="shift.name"
                  :value="shift.id"
                >
                  <span>{{ shift.name }}</span>
                  <span class="shift-time">{{ shift.startTime }}-{{ shift.endTime }}</span>
                </el-option>
                <el-option label="自定义" value="custom">
                  <span>自定义</span>
                </el-option>
              </el-select>
              
              <!-- 显示已选班次的时间 -->
              <div v-if="scope.row.schedules[index] && scope.row.schedules[index] !== 'rest'" class="selected-time">
                {{ scope.row.customTimes[index].start || '--:--' }} - {{ scope.row.customTimes[index].end || '--:--' }}
              </div>
              
              <!-- 自定义时间选择器 -->
              <div v-if="scope.row.schedules[index] === 'custom'" class="custom-time">
                <el-time-picker
                  v-model="scope.row.customTimes[index].start"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="开始时间"
                  @change="updateCustomTime(scope.row, index)"
                />
                <el-time-picker
                  v-model="scope.row.customTimes[index].end"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="结束时间"
                  @change="updateCustomTime(scope.row, index)"
                />
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-button @click="checkData">checkData</el-button>
      <!-- 保存按钮 -->
      <div class="actions">
        <el-button type="primary" @click="saveSchedules">保存排班</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { GetShifts, GetDepartmentSchedule, SaveSchedule } from '@/api/schedule'
import { GetDepartmentList } from '@/api/index'

export default {
  name: 'Scheduling',
  data() {
    return {
      departments: [],
      shifts: [],
      selectedDepartment: null,
      scheduleData: [],
      weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      loading: false
    }
  },
  created() {
    this.fetchDepartments()
    this.fetchShifts()
  },
  methods: {
    checkData(){
      console.log("checkData",this.scheduleData)
    },
    async fetchDepartments() {
      try {
        const res = await GetDepartmentList()
        this.departments = res.data
      } catch (error) {
        this.$message.error('获取部门列表失败')
      }
    },
    async fetchShifts() {
      try {
        const res = await GetShifts()
        if (res.code === 200) {
          this.shifts = res.data.rows.filter(shift => shift.isEnabled)
        }
      } catch (error) {
        this.$message.error('获取班次列表失败')
      }
    },
    async getEmployeesByDepartment() {
      if (!this.selectedDepartment) return
      
      try {
        this.loading = true
        const res = await GetDepartmentSchedule(this.selectedDepartment)
        if (res.code === 200) {
          // 初始化每个员工的排班数据
          this.scheduleData = res.data.map(emp => {
            // 为每个员工初始化一周的排班数据
            const schedules = Array(7).fill(null)
            const customTimes = Array(7).fill().map(() => ({ start: null, end: null }))

            // 如果员工已有排班数据，填充到对应的数组中
            if (emp.schedules && Array.isArray(emp.schedules)) {
              emp.schedules.forEach((schedule, index) => {
                if (schedule) {
                  if (schedule.shiftId) {
                    // 如果是预设班次
                    schedules[index] = schedule.shiftId
                  } else if (schedule.startTime && schedule.endTime) {
                    // 如果是自定义时间
                    schedules[index] = 'custom'
                  } else {
                    // 休息
                    schedules[index] = 'rest'
                  }
                  
                  // 保存时间信息
                  customTimes[index] = {
                    start: schedule.startTime || null,
                    end: schedule.endTime || null
                  }
                }
              })
            }

            return {
              ...emp,
              schedules,
              customTimes
            }
          })
        }
      } catch (error) {
        this.$message.error('获取员工排班失败')
      } finally {
        this.loading = false
      }
    },
    handleShiftChange(employee, dayIndex, shiftId) {
      if (shiftId === 'custom') {
        // 如果选择自定义，确保customTimes已初始化
        if (!employee.customTimes[dayIndex]) {
          employee.customTimes[dayIndex] = { start: null, end: null }
        }
      } else if (shiftId !== 'rest' && shiftId) {
        // 如果选择预设班次，自动填充时间
        const shift = this.shifts.find(s => s.id === shiftId)
        if (shift) {
          employee.customTimes[dayIndex] = {
            start: shift.startTime,
            end: shift.endTime
          }
        }
      }
    },
    updateCustomTime(employee, dayIndex) {
      // 更新自定义时间
      const customTime = employee.customTimes[dayIndex]
      if (customTime.start && customTime.end) {
        // 可以在这里添加时间验证逻辑
      }
    },
    async saveSchedules() {
      try {
        this.loading = true
        const schedules = this.scheduleData.map(emp => {
          return {
            employeeId: emp.id,
            departmentId: this.selectedDepartment,
            schedules: emp.schedules.map((shiftId, index) => {
              if (!shiftId) return null
              if (shiftId === 'rest') return null
              
              const customTime = emp.customTimes[index]
              return {
                shiftId: shiftId === 'custom' ? null : shiftId,
                startTime: customTime.start,
                endTime: customTime.end
              }
            })
          }
        })

        const res = await SaveSchedule({
          departmentId: this.selectedDepartment,
          schedules
        })

        if (res.code === 200) {
          this.$message.success('保存排班成功')
          this.getEmployeesByDepartment()
        }
      } catch (error) {
        this.$message.error('保存排班失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 16px;
}

.shift-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-time {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.shift-time {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.selected-time {
  color: #409EFF;
  font-size: 12px;
  text-align: center;
}

.actions {
  margin-top: 16px;
  text-align: right;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-time-picker) {
  width: 120px;
}
</style>