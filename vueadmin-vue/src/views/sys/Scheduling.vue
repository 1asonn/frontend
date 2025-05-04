<template>
  <div class="scheduling-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>职工排班管理</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="refreshData">刷新</el-button>
      </div>
      
      <!-- 部门选择 -->
      <div class="filter-container">
        <el-select v-model="selectedDepartment" placeholder="请选择部门" @change="handleDepartmentChange">
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id">
          </el-option>
        </el-select>
        
        <el-button type="primary" @click="openShiftDialog">班次管理</el-button>
        <el-button type="primary" @click="openEmployeeSelectDialog">选择员工</el-button>
        
        <el-tag v-if="selectedEmployeesMode" type="success" class="filter-tag">
          已筛选 {{ selectedEmployees.length }} 名员工
          <i class="el-icon-close" @click="clearEmployeeSelection"></i>
        </el-tag>
      </div>
      
      <!-- 排班表格 -->
      <el-table
        v-loading="loading"
        :data="filteredScheduleData"
        border
        style="width: 100%">
        <el-table-column
          prop="name"
          label="职工姓名"
          width="120">
        </el-table-column>
        
        <el-table-column
          v-for="(day, index) in weekDays"
          :key="index"
          :label="day.label"
          :width="120">
          <template slot-scope="scope">
            <div class="shift-cell">
              <template v-if="scope.row.schedules && scope.row.schedules[index]">
                <div class="shift-info">
                  <span>{{ getShiftName(scope.row.schedules[index].shiftId) }}</span>
                  <el-popover
                    placement="top"
                    width="200"
                    trigger="hover">
                    <div>
                      <p>班次: {{ getShiftName(scope.row.schedules[index].shiftId) }}</p>
                      <p>时间: {{ getShiftTime(scope.row.schedules[index].shiftId, index) }}</p>
                    </div>
                    <div slot="reference" class="shift-time">
                      {{ getShiftTime(scope.row.schedules[index].shiftId, index) }}
                    </div>
                  </el-popover>
                </div>
                <div class="shift-actions">
                  <el-button size="mini" type="danger" icon="el-icon-delete" circle
                    @click="removeSchedule(scope.row.id, index)"></el-button>
                </div>
              </template>
              <el-button v-else size="small" type="primary" plain
                @click="assignShift(scope.row.id, index)">排班</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 批量排班操作区 -->
      <div v-if="selectedEmployeesMode && selectedEmployees.length > 0" class="batch-actions">
        <el-divider content-position="left">班组排班操作</el-divider>
        
        <div class="group-info">
          <span class="group-label">当前班组：</span>
          <el-tag type="success">{{ selectedEmployees.length }} 名员工</el-tag>
          <el-button type="text" @click="openEmployeeSelectDialog">编辑班组</el-button>
        </div>
        
        <div class="week-schedule-panel">
          <div class="panel-header">
            <span class="panel-title">周排班表</span>
            <div class="panel-actions">
              <el-button size="small" type="primary" @click="openGroupShiftDialog">设置班组排班</el-button>
              <el-button size="small" type="danger" @click="clearGroupSchedule">清除班组排班</el-button>
            </div>
          </div>
          
          <el-table
            :data="weekSchedulePreview"
            border
            style="width: 100%">
            <el-table-column
              prop="day"
              label="星期"
              width="100">
            </el-table-column>
            <el-table-column
              prop="weekday"
              label="星期"
              width="120">
            </el-table-column>
            <el-table-column
              prop="shift"
              label="班次">
              <template slot-scope="scope">
                <span v-if="scope.row.shiftId">
                  {{ getShiftName(scope.row.shiftId) }}
                  <span class="shift-time-preview">
                    ({{ getShiftTime(scope.row.shiftId, scope.row.dayIndex) }})
                  </span>
                </span>
                <span v-else class="no-shift">未排班</span>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="150">
              <template slot-scope="scope">
                <el-button size="mini" type="primary" @click="setDayShift(scope.row.dayIndex)">设置</el-button>
                <el-button size="mini" type="danger" @click="removeDayShift(scope.row.dayIndex)">清除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
    
    <!-- 班次管理对话框 -->
    <el-dialog title="班次管理" :visible.sync="shiftDialogVisible" width="70%">
      <div class="shift-toolbar">
        <el-button type="primary" @click="openAddShiftDialog">新增班次</el-button>
      </div>
      
      <el-table :data="shifts" border style="width: 100%">
        <el-table-column prop="name" label="班次名称" width="120"></el-table-column>
        <el-table-column prop="description" label="描述" width="180"></el-table-column>
        <el-table-column label="周一至周五">
          <template slot-scope="scope">
            <div v-for="(day, index) in scope.row.weekSchedule.slice(0, 5)" :key="index" class="day-schedule">
              <span class="day-name">{{ ['周一', '周二', '周三', '周四', '周五'][index] }}:</span>
              <span v-if="day.enabled">{{ day.startTime }} - {{ day.endTime }}</span>
              <span v-else>休息</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="周末">
          <template slot-scope="scope">
            <div v-for="(day, index) in scope.row.weekSchedule.slice(5)" :key="index" class="day-schedule">
              <span class="day-name">{{ ['周六', '周日'][index] }}:</span>
              <span v-if="day.enabled">{{ day.startTime }} - {{ day.endTime }}</span>
              <span v-else>休息</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-button size="mini" @click="editShift(scope.row)">编辑</el-button>
            <el-button size="mini" type="danger" @click="deleteShift(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 新增/编辑班次对话框 -->
    <el-dialog :title="shiftForm.id ? '编辑班次' : '新增班次'" :visible.sync="addShiftDialogVisible" width="50%">
      <el-form :model="shiftForm" label-width="100px">
        <el-form-item label="班次名称">
          <el-input v-model="shiftForm.name"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="shiftForm.description"></el-input>
        </el-form-item>
        
        <div class="week-schedule">
          <div v-for="(day, index) in shiftForm.weekSchedule" :key="index" class="day-item">
            <div class="day-header">
              <span>{{ ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index] }}</span>
              <el-switch v-model="day.enabled"></el-switch>
            </div>
            <div class="time-inputs" v-if="day.enabled">
              <el-time-picker
                v-model="day.startTimeObj"
                format="HH:mm"
                placeholder="开始时间"
                @change="updateTimeString(index, 'start')"
                style="width: 120px">
              </el-time-picker>
              <span class="time-separator">至</span>
              <el-time-picker
                v-model="day.endTimeObj"
                format="HH:mm"
                placeholder="结束时间"
                @change="updateTimeString(index, 'end')"
                style="width: 120px">
              </el-time-picker>
            </div>
          </div>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addShiftDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveShift">确 定</el-button>
      </div>
    </el-dialog>
    
    <!-- 排班对话框 -->
    <el-dialog title="分配班次" :visible.sync="assignDialogVisible" width="30%">
      <el-form :model="assignForm">
        <el-form-item label="选择班次">
          <el-select v-model="assignForm.shiftId" placeholder="请选择班次">
            <el-option
              v-for="shift in shifts"
              :key="shift.id"
              :label="shift.name"
              :value="shift.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="assignDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmAssign">确 定</el-button>
      </div>
    </el-dialog>
    
    <!-- 班组排班设置对话框 -->
    <el-dialog title="班组排班设置" :visible.sync="groupShiftDialogVisible" width="50%">
      <el-form :model="groupShiftForm" label-width="100px">
        <el-form-item label="选择班次">
          <el-select v-model="groupShiftForm.shiftId" placeholder="请选择班次">
            <el-option
              v-for="shift in shifts"
              :key="shift.id"
              :label="shift.name"
              :value="shift.id">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="应用于">
          <el-checkbox-group v-model="groupShiftForm.applyDays">
            <el-checkbox v-for="(day, index) in weekDays" :key="index" :label="index">
              {{ day.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="groupShiftDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="applyGroupShift">确 定</el-button>
      </div>
    </el-dialog>
    
    <!-- 单日班次设置对话框 -->
    <el-dialog title="设置班次" :visible.sync="dayShiftDialogVisible" width="30%">
      <div class="day-info" v-if="currentDayIndex !== null">
        <p><strong>日期：</strong>{{ weekDays[currentDayIndex].label }}</p>
      </div>
      
      <el-form :model="dayShiftForm">
        <el-form-item label="选择班次">
          <el-select v-model="dayShiftForm.shiftId" placeholder="请选择班次">
            <el-option
              v-for="shift in shifts"
              :key="shift.id"
              :label="shift.name"
              :value="shift.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dayShiftDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="applyDayShift">确 定</el-button>
      </div>
    </el-dialog>
    
    <!-- 员工选择对话框 -->
    <el-dialog title="选择员工" :visible.sync="employeeSelectDialogVisible" width="50%">
      <div class="employee-select-toolbar">
        <el-input
          placeholder="搜索员工"
          v-model="employeeSearchKeyword"
          prefix-icon="el-icon-search"
          clearable
          @clear="handleEmployeeSearchClear"
          style="width: 250px; margin-right: 10px">
        </el-input>
        <el-button type="primary" @click="selectAllEmployees">全选</el-button>
        <el-button @click="deselectAllEmployees">取消全选</el-button>
      </div>
      
      <el-table
        ref="employeeSelectTable"
        :data="filteredEmployeeList"
        border
        @selection-change="handleEmployeeSelectionChange">
        <el-table-column
          type="selection"
          width="55">
        </el-table-column>
        <el-table-column
          prop="id"
          label="ID"
          width="80">
        </el-table-column>
        <el-table-column
          prop="name"
          label="姓名"
          width="120">
        </el-table-column>
        <el-table-column
          label="部门"
          width="120">
          <template slot-scope="scope">
            {{ getDepartmentName(scope.row.departmentId) }}
          </template>
        </el-table-column>
      </el-table>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="employeeSelectDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmEmployeeSelection">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getDepartments, getShifts, createShift, updateShift, deleteShift, 
         getSchedulesByDepartment, assignShift, removeShift } from '@/api/scheduling'
import moment from 'moment'

export default {
  name: 'Scheduling',
  data() {
    return {
      loading: false,
      departments: [],
      selectedDepartment: null,
      weekDays: [
        { label: '周一', weekday: '周一' },
        { label: '周二', weekday: '周二' },
        { label: '周三', weekday: '周三' },
        { label: '周四', weekday: '周四' },
        { label: '周五', weekday: '周五' },
        { label: '周六', weekday: '周六' },
        { label: '周日', weekday: '周日' }
      ],
      scheduleData: [],
      shifts: [],
      
      // 员工选择相关
      allEmployees: [],
      selectedEmployees: [],
      selectedEmployeesMode: false,
      employeeSelectDialogVisible: false,
      employeeSearchKeyword: '',
      
      // 班组排班相关
      weekSchedulePreview: [],
      groupShiftDialogVisible: false,
      dayShiftDialogVisible: false,
      currentDayIndex: null,
      groupShiftForm: {
        shiftId: null,
        applyDays: []
      },
      dayShiftForm: {
        shiftId: null
      },
      
      // 对话框控制
      shiftDialogVisible: false,
      addShiftDialogVisible: false,
      assignDialogVisible: false,
      
      // 表单数据
      shiftForm: {
        id: null,
        name: '',
        description: '',
        weekSchedule: Array(7).fill().map(() => ({
          enabled: false,
          startTime: '',
          endTime: '',
          startTimeObj: null,
          endTimeObj: null
        }))
      },
      
      assignForm: {
        employeeId: null,
        dayIndex: null,
        shiftId: null,
        date: null
      }
    }
  },
  
  created() {
    this.fetchDepartments()
    this.fetchShifts()
  },
  
  watch: {
    // 监听周数据变化，更新班组排班预览
    weekDays: {
      handler() {
        this.initWeekSchedulePreview()
      },
      deep: true
    },
    
    // 监听员工选择状态变化
    selectedEmployeesMode(val) {
      if (val) {
        this.initWeekSchedulePreview()
      }
    }
  },
  
  computed: {
    // 根据员工选择过滤排班数据
    filteredScheduleData() {
      if (!this.selectedEmployeesMode || this.selectedEmployees.length === 0) {
        return this.scheduleData
      }
      
      return this.scheduleData.filter(employee => 
        this.selectedEmployees.some(selected => selected.id === employee.id)
      )
    },
    
    // 根据搜索关键词过滤员工列表
    filteredEmployeeList() {
      if (!this.employeeSearchKeyword) {
        return this.allEmployees
      }
      
      const keyword = this.employeeSearchKeyword.toLowerCase()
      return this.allEmployees.filter(employee => 
        employee.name.toLowerCase().includes(keyword)
      )
    }
  },
  
  methods: {

    
    // 获取部门列表
    async fetchDepartments() {
      try {
        const res = await getDepartments()
        if (res.code === 200) {
          this.departments = res.data
          if (this.departments.length > 0 && !this.selectedDepartment) {
            this.selectedDepartment = this.departments[0].id
            this.fetchScheduleData()
          }
        }
      } catch (error) {
        this.$message.error('获取部门列表失败')
        console.error(error)
      }
    },
    
    // 获取班次列表
    async fetchShifts() {
      try {
        const res = await getShifts()
        if (res.code === 200) {
          this.shifts = res.data
          // 为班次添加时间对象，方便编辑
          this.shifts.forEach(shift => {
            shift.weekSchedule.forEach(day => {
              if (day.enabled) {
                day.startTimeObj = day.startTime ? moment(day.startTime, 'HH:mm').toDate() : null
                day.endTimeObj = day.endTime ? moment(day.endTime, 'HH:mm').toDate() : null
              }
            })
          })
        }
      } catch (error) {
        this.$message.error('获取班次列表失败')
        console.error(error)
      }
    },
    
    // 获取排班数据
    async fetchScheduleData() {
      if (!this.selectedDepartment) return
      
      this.loading = true
      try {
        const res = await getSchedulesByDepartment(this.selectedDepartment)
        if (res.code === 200) {
          this.scheduleData = res.data
          this.allEmployees = [...res.data]
        }
      } catch (error) {
        this.$message.error('获取排班数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    
    // 刷新数据
    refreshData() {
      this.fetchDepartments()
      this.fetchShifts()
      this.fetchScheduleData()
    },
    
    // 部门变更
    handleDepartmentChange() {
      this.fetchScheduleData()
      // 清除员工选择，因为部门已经变更
      this.clearEmployeeSelection()
    },
    

    
    // 获取班次名称
    getShiftName(shiftId) {
      const shift = this.shifts.find(s => s.id === shiftId)
      return shift ? shift.name : '未知班次'
    },
    
    // 获取部门名称
    getDepartmentName(departmentId) {
      const department = this.departments.find(d => d.id === departmentId)
      return department ? department.name : '未知部门'
    },
    
    // 获取班次时间
    getShiftTime(shiftId, dayIndex) {
      const shift = this.shifts.find(s => s.id === shiftId)
      if (!shift || !shift.weekSchedule[dayIndex].enabled) return ''
      
      return `${shift.weekSchedule[dayIndex].startTime} - ${shift.weekSchedule[dayIndex].endTime}`
    },
    
    // 打开班次管理对话框
    openShiftDialog() {
      this.shiftDialogVisible = true
    },
    
    // 打开新增班次对话框
    openAddShiftDialog() {
      this.shiftForm = {
        id: null,
        name: '',
        description: '',
        weekSchedule: Array(7).fill().map(() => ({
          enabled: false,
          startTime: '',
          endTime: '',
          startTimeObj: null,
          endTimeObj: null
        }))
      }
      this.addShiftDialogVisible = true
    },
    
    // 编辑班次
    editShift(shift) {
      // 深拷贝班次数据
      this.shiftForm = JSON.parse(JSON.stringify(shift))
      
      // 转换时间字符串为时间对象
      this.shiftForm.weekSchedule.forEach(day => {
        if (day.enabled) {
          day.startTimeObj = day.startTime ? moment(day.startTime, 'HH:mm').toDate() : null
          day.endTimeObj = day.endTime ? moment(day.endTime, 'HH:mm').toDate() : null
        }
      })
      
      this.addShiftDialogVisible = true
    },
    
    // 更新时间字符串
    updateTimeString(index, type) {
      const day = this.shiftForm.weekSchedule[index]
      if (type === 'start' && day.startTimeObj) {
        day.startTime = moment(day.startTimeObj).format('HH:mm')
      } else if (type === 'end' && day.endTimeObj) {
        day.endTime = moment(day.endTimeObj).format('HH:mm')
      }
    },
    
    // 保存班次
    async saveShift() {
      // 验证表单
      if (!this.shiftForm.name) {
        this.$message.warning('请输入班次名称')
        return
      }
      
      // 处理时间数据
      const formData = JSON.parse(JSON.stringify(this.shiftForm))
      formData.weekSchedule.forEach(day => {
        if (!day.enabled) {
          day.startTime = ''
          day.endTime = ''
        }
        delete day.startTimeObj
        delete day.endTimeObj
      })
      
      try {
        let res
        if (formData.id) {
          // 更新班次
          res = await updateShift(formData.id, formData)
        } else {
          // 创建班次
          res = await createShift(formData)
        }
        
        if (res.code === 200) {
          this.$message.success(formData.id ? '班次更新成功' : '班次创建成功')
          this.addShiftDialogVisible = false
          this.fetchShifts()
        }
      } catch (error) {
        this.$message.error(formData.id ? '班次更新失败' : '班次创建失败')
        console.error(error)
      }
    },
    
    // 删除班次
    async deleteShift(id) {
      try {
        await this.$confirm('此操作将永久删除该班次, 是否继续?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const res = await deleteShift(id)
        if (res.code === 200) {
          this.$message.success('删除成功')
          this.fetchShifts()
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
          console.error(error)
        }
      }
    },
    
    // 分配班次
    assignShift(employeeId, dayIndex) {
      this.assignForm = {
        employeeId,
        dayIndex,
        shiftId: null,
        date: this.weekDays[dayIndex].date
      }
      this.assignDialogVisible = true
    },
    
    // 初始化周排班预览
    initWeekSchedulePreview() {
      this.weekSchedulePreview = this.weekDays.map((day, index) => ({
        day: day.label,
        weekday: day.weekday,
        dayIndex: index,
        shiftId: null
      }))
    },
    
    // 打开班组排班对话框
    openGroupShiftDialog() {
      this.groupShiftForm = {
        shiftId: null,
        applyDays: []
      }
      this.groupShiftDialogVisible = true
    },
    
    // 清除班组排班
    async clearGroupSchedule() {
      try {
        await this.$confirm(`确定要清除所有 ${this.selectedEmployees.length} 名员工的本周排班吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 模拟清除成功
        let successCount = 0
        
        for (const employee of this.selectedEmployees) {
          const employeeIndex = this.scheduleData.findIndex(e => e.id === employee.id)
          if (employeeIndex !== -1) {
            if (this.scheduleData[employeeIndex].schedules) {
              // 清除所有天的排班
              for (let i = 0; i < this.weekDays.length; i++) {
                if (this.scheduleData[employeeIndex].schedules[i]) {
                  this.$set(this.scheduleData[employeeIndex].schedules, i, null)
                }
              }
              successCount++
            }
          }
        }
        
        // 清除预览数据
        this.weekSchedulePreview.forEach(day => {
          day.shiftId = null
        })
        
        if (successCount > 0) {
          this.$message.success(`成功清除 ${successCount} 名员工的排班`)
        } else {
          this.$message.warning('没有员工的排班被清除')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('清除排班失败')
          console.error(error)
        }
      }
    },
    
    // 设置单天班次
    setDayShift(dayIndex) {
      this.currentDayIndex = dayIndex
      this.dayShiftForm = {
        shiftId: this.weekSchedulePreview[dayIndex].shiftId || null
      }
      this.dayShiftDialogVisible = true
    },
    
    // 应用单天班次
    async applyDayShift() {
      if (!this.dayShiftForm.shiftId) {
        this.$message.warning('请选择班次')
        return
      }
      
      try {
        // 更新预览数据
        this.$set(this.weekSchedulePreview[this.currentDayIndex], 'shiftId', this.dayShiftForm.shiftId)
        
        // 更新所有选中员工的排班数据
        let successCount = 0
        
        for (const employee of this.selectedEmployees) {
          const employeeIndex = this.scheduleData.findIndex(e => e.id === employee.id)
          if (employeeIndex !== -1) {
            if (!this.scheduleData[employeeIndex].schedules) {
              this.scheduleData[employeeIndex].schedules = []
            }
            
            // 更新排班数据
            this.$set(this.scheduleData[employeeIndex].schedules, this.currentDayIndex, {
              shiftId: this.dayShiftForm.shiftId,
              weekday: this.weekDays[this.currentDayIndex].weekday
            })
            
            successCount++
          }
        }
        
        this.dayShiftDialogVisible = false
        
        if (successCount > 0) {
          this.$message.success(`成功为 ${successCount} 名员工设置班次`)
        } else {
          this.$message.warning('没有员工被设置班次')
        }
      } catch (error) {
        this.$message.error('设置班次失败')
        console.error(error)
      }
    },
    
    // 移除单天班次
    async removeDayShift(dayIndex) {
      try {
        await this.$confirm(`确定要移除 ${this.weekDays[dayIndex].label} 的排班吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 更新预览数据
        this.$set(this.weekSchedulePreview[dayIndex], 'shiftId', null)
        
        // 更新所有选中员工的排班数据
        let successCount = 0
        
        for (const employee of this.selectedEmployees) {
          const employeeIndex = this.scheduleData.findIndex(e => e.id === employee.id)
          if (employeeIndex !== -1 && this.scheduleData[employeeIndex].schedules) {
            // 移除排班数据
            if (this.scheduleData[employeeIndex].schedules[dayIndex]) {
              this.$set(this.scheduleData[employeeIndex].schedules, dayIndex, null)
              successCount++
            }
          }
        }
        
        if (successCount > 0) {
          this.$message.success(`成功移除 ${successCount} 名员工的排班`)
        } else {
          this.$message.warning('没有员工的排班被移除')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('移除排班失败')
          console.error(error)
        }
      }
    },
    
    // 应用班组排班
    async applyGroupShift() {
      if (!this.groupShiftForm.shiftId) {
        this.$message.warning('请选择班次')
        return
      }
      
      if (this.groupShiftForm.applyDays.length === 0) {
        this.$message.warning('请选择要应用的日期')
        return
      }
      
      try {
        // 更新预览数据
        this.groupShiftForm.applyDays.forEach(dayIndex => {
          this.$set(this.weekSchedulePreview[dayIndex], 'shiftId', this.groupShiftForm.shiftId)
        })
        
        // 更新所有选中员工的排班数据
        let successCount = 0
        
        for (const employee of this.selectedEmployees) {
          const employeeIndex = this.scheduleData.findIndex(e => e.id === employee.id)
          if (employeeIndex !== -1) {
            if (!this.scheduleData[employeeIndex].schedules) {
              this.scheduleData[employeeIndex].schedules = []
            }
            
            // 更新所有选中日期的排班数据
            this.groupShiftForm.applyDays.forEach(dayIndex => {
              this.$set(this.scheduleData[employeeIndex].schedules, dayIndex, {
                shiftId: this.groupShiftForm.shiftId,
                weekday: this.weekDays[dayIndex].weekday
              })
            })
            
            successCount++
          }
        }
        
        this.groupShiftDialogVisible = false
        
        if (successCount > 0) {
          this.$message.success(`成功为 ${successCount} 名员工设置班次`)
        } else {
          this.$message.warning('没有员工被设置班次')
        }
      } catch (error) {
        this.$message.error('设置班次失败')
        console.error(error)
      }
    },
    
    // 确认分配班次
    async confirmAssign() {
      if (!this.assignForm.shiftId) {
        this.$message.warning('请选择班次')
        return
      }
      
      try {
        // 这里应该调用实际的API，目前使用模拟数据
        // const res = await assignShift(this.assignForm)
        
        // 模拟成功响应
        const employeeIndex = this.scheduleData.findIndex(e => e.id === this.assignForm.employeeId)
        if (employeeIndex !== -1) {
          if (!this.scheduleData[employeeIndex].schedules) {
            this.scheduleData[employeeIndex].schedules = []
          }
          
          // 更新排班数据
          this.$set(this.scheduleData[employeeIndex].schedules, this.assignForm.dayIndex, {
            shiftId: this.assignForm.shiftId,
            date: this.assignForm.date
          })
          
          this.$message.success('排班成功')
          this.assignDialogVisible = false
        }
      } catch (error) {
        this.$message.error('排班失败')
        console.error(error)
      }
    },
    
    // 移除排班
    async removeSchedule(employeeId, dayIndex) {
      try {
        await this.$confirm('确定要移除该排班吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        // 这里应该调用实际的API，目前使用模拟数据
        // const res = await removeShift({
        //   employeeId,
        //   date: this.weekDays[dayIndex].date
        // })
        
        // 模拟成功响应
        const employeeIndex = this.scheduleData.findIndex(e => e.id === employeeId)
        if (employeeIndex !== -1 && this.scheduleData[employeeIndex].schedules) {
          // 移除排班数据
          this.$set(this.scheduleData[employeeIndex].schedules, dayIndex, null)
          this.$message.success('已移除排班')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('移除排班失败')
          console.error(error)
        }
      }
    },
    
    // 打开员工选择对话框
    openEmployeeSelectDialog() {
      this.employeeSelectDialogVisible = true
      this.employeeSearchKeyword = ''
      
      // 在对话框打开后，设置已选中的员工
      this.$nextTick(() => {
        if (this.selectedEmployeesMode && this.selectedEmployees.length > 0) {
          this.selectedEmployees.forEach(employee => {
            const index = this.allEmployees.findIndex(e => e.id === employee.id)
            if (index !== -1) {
              this.$refs.employeeSelectTable.toggleRowSelection(this.allEmployees[index], true)
            }
          })
        }
      })
    },
    
    // 处理员工选择变更
    handleEmployeeSelectionChange(selectedRows) {
      // 暂存选中的员工，等确认后再更新 selectedEmployees
      this.tempSelectedEmployees = selectedRows
    },
    
    // 确认员工选择
    confirmEmployeeSelection() {
      this.selectedEmployees = [...this.tempSelectedEmployees]
      this.selectedEmployeesMode = this.selectedEmployees.length > 0
      this.employeeSelectDialogVisible = false
      
      if (this.selectedEmployees.length > 0) {
        this.$message.success(`已选择 ${this.selectedEmployees.length} 名员工进行排班`)
        // 初始化周排班预览
        this.initWeekSchedulePreview()
        // 尝试从已有排班中提取预览数据
        this.updateWeekSchedulePreviewFromEmployees()
      } else {
        this.clearEmployeeSelection()
      }
    },
    
    // 从员工排班数据中更新预览
    updateWeekSchedulePreviewFromEmployees() {
      if (!this.selectedEmployees.length || !this.weekSchedulePreview.length) return
      
      // 获取第一个员工的排班信息作为预览基础
      const firstEmployee = this.scheduleData.find(e => e.id === this.selectedEmployees[0].id)
      if (firstEmployee && firstEmployee.schedules) {
        for (let i = 0; i < this.weekDays.length; i++) {
          if (firstEmployee.schedules[i]) {
            this.$set(this.weekSchedulePreview[i], 'shiftId', firstEmployee.schedules[i].shiftId)
          }
        }
      }
    },
    
    // 清除员工选择
    clearEmployeeSelection() {
      this.selectedEmployees = []
      this.selectedEmployeesMode = false
    },
    
    // 全选员工
    selectAllEmployees() {
      this.filteredEmployeeList.forEach(row => {
        this.$refs.employeeSelectTable.toggleRowSelection(row, true)
      })
    },
    
    // 取消全选
    deselectAllEmployees() {
      this.$refs.employeeSelectTable.clearSelection()
    },
    
    // 处理员工搜索清除
    handleEmployeeSearchClear() {
      this.employeeSearchKeyword = ''
    }
  }
}
</script>

<style scoped>
.scheduling-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.shift-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 60px;
}

.shift-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 5px;
}

.shift-time {
  font-size: 12px;
  color: #606266;
}

.shift-actions {
  margin-top: 5px;
}

.shift-toolbar {
  margin-bottom: 15px;
}

.day-schedule {
  margin: 5px 0;
  font-size: 13px;
}

.day-name {
  font-weight: bold;
  margin-right: 5px;
}

.week-schedule {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.day-item {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 10px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.time-separator {
  text-align: center;
  margin: 5px 0;
}

.filter-tag {
  margin-left: 10px;
  display: flex;
  align-items: center;
}

.filter-tag .el-icon-close {
  margin-left: 5px;
  cursor: pointer;
}

.employee-select-toolbar {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.batch-actions {
  margin-top: 20px;
}

.batch-schedule-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  margin-top: 15px;
}

.batch-label {
  font-weight: bold;
  margin-right: 5px;
}

.batch-day-selector,
.batch-shift-selector {
  display: flex;
  align-items: center;
}

.group-info {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.group-label {
  font-weight: bold;
  margin-right: 10px;
}

.week-schedule-panel {
  margin-top: 15px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.shift-time-preview {
  font-size: 12px;
  color: #606266;
  margin-left: 5px;
}

.no-shift {
  color: #909399;
}

.day-info {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>