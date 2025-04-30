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
      <div v-loading="loading">
        <el-table :data="scheduleData" border style="width: 100%">
          <el-table-column label="员工姓名" width="120">
            <template #default="scope">
              {{ scope.row.employee ? scope.row.employee.username : '' }}
            </template>
          </el-table-column>
          
          <!-- 周一到周日的排班列 -->
          <el-table-column v-for="(day, index) in weekDays" :key="day" :label="day" :prop="weekDayProps[index]">
            <template #default="scope">
              <div class="shift-cell">
                <el-select 
                  v-model="scope.row[weekDayProps[index]]" 
                  placeholder="选择班次"
                >
                  <el-option label="休息" value="null">
                    <span>休息</span>
                  </el-option>
                  <el-option
                    v-for="shift in shifts"
                    :key="shift.id"
                    :label="shift.name"
                    :value="shift.id.toString()"
                  >
                    <span>{{ shift.name }}</span>
                    <span class="shift-time">{{ formatTime(shift.startTime) }}-{{ formatTime(shift.endTime) }}</span>
                  </el-option>
                </el-select>
                
                <!-- 显示已选班次的名称 -->
                <div v-if="scope.row[weekDayProps[index]] && scope.row[weekDayProps[index]] !== 'null'" class="selected-shift">
                  {{ getShiftName(scope.row[weekDayProps[index]]) }}
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <div v-if="scheduleData.length === 0 && selectedDepartment" class="empty-data">
          没有找到排班数据
        </div>
        
        <!-- 保存按钮 -->
        <div class="actions">
          <el-button @click="checkData">检查数据</el-button>
          <el-button type="primary" @click="saveSchedules">保存排班</el-button>
        </div>
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
      weekDayProps: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      loading: false,
      shiftMap: {} // 用于快速查找班次信息
    }
  },
  created() {
    this.fetchDepartments()
    this.fetchShifts()
  },
  methods: {
    checkData() {
      console.log("排班数据", this.scheduleData)
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
          
          // 创建班次ID到班次对象的映射，方便快速查找
          this.shiftMap = {}
          this.shifts.forEach(shift => {
            this.shiftMap[shift.id] = shift
          })
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
          // 直接使用后端返回的数据
          this.scheduleData = res.data
          
          // 将数字转换为字符串，以便于在选择器中正确匹配
          this.scheduleData.forEach(schedule => {
            this.weekDayProps.forEach(day => {
              if (schedule[day] && schedule[day] !== 'null') {
                schedule[day] = schedule[day].toString()
              }
            })
          })
        }
      } catch (error) {
        console.error('获取员工排班失败:', error)
        this.$message.error('获取员工排班失败')
      } finally {
        this.loading = false
      }
    },
    formatTime(timeString) {
      if (!timeString) return '--:--'
      // 如果时间已经是HH:MM:SS格式，只需要取前5位
      return timeString.substring(0, 5)
    },
    getShiftName(shiftId) {
      if (!shiftId || shiftId === 'null') return '休息'
      const shift = this.shiftMap[shiftId]
      return shift ? shift.name : ''
    },
    async saveSchedules() {
      try {
        this.loading = true
        
        // 遍历每个员工的排班数据，为每个员工单独保存排班
        for (const emp of this.scheduleData) {
          // 准备符合后端API的数据结构
          const scheduleData = {
            employeeId: emp.employee.id,
            monday: emp.monday === 'null' ? null : emp.monday,
            tuesday: emp.tuesday === 'null' ? null : emp.tuesday,
            wednesday: emp.wednesday === 'null' ? null : emp.wednesday,
            thursday: emp.thursday === 'null' ? null : emp.thursday,
            friday: emp.friday === 'null' ? null : emp.friday,
            saturday: emp.saturday === 'null' ? null : emp.saturday,
            sunday: emp.sunday === 'null' ? null : emp.sunday,
            departmentId: this.selectedDepartment
          }
          
          // 调用API保存单个员工的排班
          const res = await SaveSchedule(scheduleData)
          
          if (res.code !== 200) {
            this.$message.error(`保存${emp.employee.username}的排班失败: ${res.message || '未知错误'}`)
            return
          }
        }
        
        this.$message.success('所有排班保存成功')
        this.getEmployeesByDepartment()
      } catch (error) {
        console.error('保存排班失败:', error)
        this.$message.error('保存排班失败: ' + (error.message || '未知错误'))
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

.shift-time {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.selected-shift {
  color: #409EFF;
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
}

.actions {
  margin-top: 16px;
  text-align: right;
}

.empty-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}

:deep(.el-select) {
  width: 100%;
}
</style>
