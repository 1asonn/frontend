<template>
  <div class="scheduling-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>职工排班管理</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="refreshData">刷新</el-button>
      </div>
      
      <!-- 部门选择和操作按钮 -->
      <div class="filter-container">
        <el-select v-model="selectedDepartment" placeholder="请选择部门" @change="handleDepartmentChange">
          <el-option
            v-for="dept in departments"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id">
          </el-option>
        </el-select>
        
        <el-button type="primary" @click="openEmployeeSelectDialog">选择员工</el-button>
        
        <el-tag v-if="selectedEmployeesMode" type="success" class="filter-tag">
          已筛选 {{ selectedEmployees.length }} 名员工
          <i class="el-icon-close" @click="clearEmployeeSelection"></i>
        </el-tag>
        
        <!-- 排班操作按钮 -->
        <div class="schedule-actions">
          <el-button 
            type="success" 
            :disabled="!hasUnsavedChanges" 
            @click="saveAllSchedules">
            <i class="el-icon-check"></i> 保存所有排班更改
          </el-button>
          <el-button 
            type="danger" 
            :disabled="!hasUnsavedChanges" 
            @click="discardAllChanges">
            <i class="el-icon-close"></i> 放弃更改
          </el-button>
          <el-tag v-if="hasUnsavedChanges" type="warning">有未保存的排班更改</el-tag>
        </div>
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
          <template slot-scope="scope">
            <el-link type="primary" @click="showEmployeeInfo(scope.row)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column
          v-for="(day, index) in weekDays"
          :key="index"
          :label="day.weekday"
          :width="120">
          <template slot-scope="scope">
            <div class="shift-cell">
              <template v-if="scope.row.schedules && scope.row.schedules[index]">
                <div class="shift-info">
                  <el-popover
                    placement="top"
                    width="200"
                    trigger="hover">
                    <div>
                      <p><strong>班次:</strong> {{ getShiftName(scope.row.schedules[index].shiftId) }}</p>
                      <p><strong>时间:</strong> {{ getShiftTime(scope.row.schedules[index].shiftId, index) }}</p>
                    </div>
                    <div slot="reference" class="shift-badge">
                      <el-tag size="medium" :type="getShiftTagType(scope.row.schedules[index].shiftId)">
                        {{ getShiftName(scope.row.schedules[index].shiftId) }}
                      </el-tag>
                    </div>
                  </el-popover>
                  <el-button size="mini" type="danger" icon="el-icon-delete" circle class="delete-btn"
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
    
    <!-- 员工详细信息对话框 -->
    <el-dialog title="员工详细信息" :visible.sync="employeeInfoDialogVisible" width="600px" custom-class="employee-info-dialog">
      <div v-if="selectedEmployee" class="employee-info">
        <div class="employee-header">
          <div class="employee-avatar">
            <img :src="getEmployeeAvatar(selectedEmployee)" alt="员工头像">
          </div>
          <div class="employee-title">
            <h2>{{ selectedEmployee.name }}</h2>
            <div class="employee-tags">
              <el-tag size="small" type="primary">{{ getDepartmentName(selectedEmployee.departmentId) }}</el-tag>
              <el-tag size="small" type="success" v-if="selectedEmployee.employee?.role_id">{{ getRoleName(selectedEmployee.employee?.role_id) }}</el-tag>
            </div>
          </div>
        </div>
        
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">
            <span class="info-value">{{ selectedEmployee.name }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="用户名">
            <span class="info-value">{{ selectedEmployee.employee?.username || '无' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            <span class="info-value">{{ formatGender(selectedEmployee.employee?.gender) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="出生日期">
            <span class="info-value">{{ formatDate(selectedEmployee.employee?.birth_date) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="年龄" v-if="selectedEmployee.employee?.birth_date">
            <span class="info-value">{{ calculateAge(selectedEmployee.employee?.birth_date) }}岁</span>
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            <span class="info-value">{{ getDepartmentName(selectedEmployee.departmentId) }}</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">联系信息</el-divider>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="手机号">
            <span class="info-value contact-value">
              {{ selectedEmployee.employee?.phone || '无' }}
              <el-button v-if="selectedEmployee.employee?.phone" type="text" icon="el-icon-document-copy" @click="copyToClipboard(selectedEmployee.employee.phone)"></el-button>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="身份证号">
            <span class="info-value contact-value">
              {{ selectedEmployee.employee?.identity || '无' }}
              <el-button v-if="selectedEmployee.employee?.identity" type="text" icon="el-icon-document-copy" @click="copyToClipboard(selectedEmployee.employee.identity)"></el-button>
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="地址">
            <span class="info-value">{{ selectedEmployee.employee?.address || '无' }}</span>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">本周排班</el-divider>
        
        <div class="weekly-schedule-summary">
          <el-table :data="getEmployeeWeeklySchedule()" size="small" border>
            <el-table-column label="星期" prop="weekday" width="80"></el-table-column>
            <el-table-column label="班次" prop="shiftName">
              <template slot-scope="scope">
                <el-tag :type="getShiftTagType(scope.row.shiftId)" v-if="scope.row.shiftId">
                  {{ scope.row.shiftName }}
                </el-tag>
                <span v-else>休息</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" prop="time" width="180"></el-table-column>
          </el-table>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="employeeInfoDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="editEmployee" v-if="hasEditPermission">编辑员工</el-button>
      </span>
    </el-dialog>
    
    <!-- 班次管理对话框 -->
    <el-dialog title="班次管理" :visible.sync="shiftDialogVisible" width="70%">
      <div class="shift-toolbar">
        <el-button type="primary" @click="openAddShiftDialog">新增班次</el-button>
      </div>
      
      <el-table :data="shifts" border style="width: 100%">
        <el-table-column prop="name" label="班次名称" width="120"></el-table-column>
        <el-table-column prop="description" label="描述" width="180"></el-table-column>
        <el-table-column label="周一至周日" width="400">
          <template slot-scope="scope">
            <div v-for="(day, index) in scope.row.weekSchedule" :key="index" class="day-schedule">
              <span class="day-name">{{ ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index] }}:</span>
              <span v-if="day && day.enabled">{{ day.startTime }} - {{ day.endTime }}</span>
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
import { GetShifts, CreateShift, UpdateShift, DeleteShift, GetDepartmentSchedule, SaveSchedule, GetSchedules, GetSchedulesByPage, GetCurrentSchedule } from '@/api/schedule'
import { GetDepartmentList } from '@/api/index'
import moment from 'moment'

export default {
  name: 'Scheduling',
  data() {
    return {
      // 部门选择
      departments: [],
      selectedDepartment: '',
      
      // 排班数据
      scheduleData: [],
      originalScheduleData: [], // 原始排班数据（用于比较是否有更改）
      hasUnsavedChanges: false, // 是否有未保存的更改
      loading: false,
      
      // 班次数据
      shifts: [],
      shiftsLoaded: false,
      
      // 周排班预览
      weekDays: [
        { weekday: '星期一', date: null },
        { weekday: '星期二', date: null },
        { weekday: '星期三', date: null },
        { weekday: '星期四', date: null },
        { weekday: '星期五', date: null },
        { weekday: '星期六', date: null },
        { weekday: '星期日', date: null }
      ],
      
      // 班次分配对话框
      assignDialogVisible: false,
      currentEmployee: null,
      currentDay: null,
      selectedShift: '',
      
      // 班次管理对话框
      shiftDialogVisible: false,
      addShiftDialogVisible: false,
      shiftForm: {
        id: '',
        name: '',
        startTime: '',
        endTime: ''
      },
      shiftFormRules: {
        name: [
          { required: true, message: '请输入班次名称', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择开始时间', trigger: 'change' }
        ],
        endTime: [
          { required: true, message: '请选择结束时间', trigger: 'change' }
        ]
      },
      editingShiftId: null,
      
      // 批量排班对话框
      groupShiftDialogVisible: false,
      groupShiftForm: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      },
      
      // 员工选择对话框
      employeeSelectDialogVisible: false,
      allEmployees: [],
      filteredEmployees: [],
      selectedEmployees: [],
      selectedEmployeesMode: false,
      employeeSearchKeyword: '',
      
      // 周排班预览（批量排班）
      weekSchedulePreview: [],
      
      // 员工信息对话框
      employeeInfoDialogVisible: false,
      selectedEmployee: null,
      hasEditPermission: false,
      
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
      
      // 单日班次设置
      dayShiftDialogVisible: false,
      currentDayIndex: null,
      dayShiftForm: {
        shiftId: null
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
        const res = await GetDepartmentList()
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
      }},
    
    // 获取班次列表
    async fetchShifts() {
      try {
        const res = await GetShifts()
        if (res.code === 200) {
          // 确保 shifts 是一个数组
          if (Array.isArray(res.data)) {
            this.shifts = res.data;
          } else if (res.data && Array.isArray(res.data.rows)) {
            // 如果返回的是分页数据结构，使用rows字段
            this.shifts = res.data.rows;
          } else if (res.data && Array.isArray(res.data.list)) {
            // 兼容list字段的格式
            this.shifts = res.data.list;
          } else {
            // 如果不是数组格式，设置为空数组
            console.error('班次数据格式不正确:', res.data);
            this.shifts = [];
            return;
          }
          
          // 为班次添加时间对象，方便编辑
          this.shifts.forEach(shift => {
            if (shift.weekSchedule && Array.isArray(shift.weekSchedule)) {
              shift.weekSchedule.forEach(day => {
                if (day && day.enabled) {
                  day.startTimeObj = day.startTime ? moment(day.startTime, 'HH:mm').toDate() : null
                  day.endTimeObj = day.endTime ? moment(day.endTime, 'HH:mm').toDate() : null
                }
              })
            } else {
              // 如果没有weekSchedule属性，创建一个默认的
              shift.weekSchedule = Array(7).fill().map(() => ({
                enabled: false,
                startTime: '',
                endTime: '',
                startTimeObj: null,
                endTimeObj: null
              }));
            }
          })
        } else {
          this.$message.error(res.message || '获取班次列表失败')
          this.shifts = [];
        }
      } catch (error) {
        this.$message.error('获取班次列表失败')
        console.error(error)
        this.shifts = [];
      }
    },
    
    // 获取排班数据
    async fetchScheduleData() {
      if (!this.selectedDepartment) {
        console.log('未选择部门，无法获取排班数据');
        return;
      }
      
      this.loading = true;
      console.log('开始获取部门ID为', this.selectedDepartment, '的排班数据');
      
      try {
        // 使用GetDepartmentSchedule API函数
        const response = await GetDepartmentSchedule(this.selectedDepartment);
        console.log('原始 API 响应:', response);
        
        console.log('响应类型:', typeof response, '响应内容:', response);
        
        // 处理不同的响应格式
        let apiData;
        if (response.status === 200) {
          if (response.data && response.data.code === 200) {
            // 标准响应格式
            apiData = response.data.data;
          } else if (response.code === 200) {
            // 直接返回的响应格式
            apiData = response.data;
          } else {
            // 其他可能的格式
            apiData = Array.isArray(response) ? response : 
                     Array.isArray(response.data) ? response.data : 
                     response.data?.data || [];
          }
        } else {
          apiData = [];
        }
        
        console.log('解析后的排班数据:', apiData);
        
        if (!Array.isArray(apiData)) {
          console.error('排班数据不是数组格式:', apiData);
          this.$message.error('排班数据格式不正确');
          this.scheduleData = [];
          this.loading = false;
          return;
        }
        
        // 转换后端返回的数据格式为前端需要的格式
        const formattedData = [];
        
        for (const item of apiData) {
          try {
            if (!item.employee) {
              console.warn('跳过没有employee属性的排班数据:', item);
              continue;
            }
            
            // 提取员工基本信息
            const employee = {
              id: item.employee.id,
              name: item.employee.realname,
              departmentId: item.employee.department_id,
              employee: item.employee, // 保存完整的employee对象以便查看详情
              schedules: []
            };
            
            // 将星期几的排班数据转换为数组格式
            const weekdayMapping = {
              0: item.monday,
              1: item.tuesday,
              2: item.wednesday,
              3: item.thursday,
              4: item.friday,
              5: item.saturday,
              6: item.sunday
            };
            
            // 填充排班数据
            for (let i = 0; i < 7; i++) {
              const shiftId = weekdayMapping[i];
              console.log(`员工 ${employee.name} 的第 ${i} 天排班班次ID:`, shiftId, '类型:', typeof shiftId);
              
              // 处理不同类型的shiftId值
              if (shiftId && shiftId !== 'null' && shiftId !== null) {
                const parsedShiftId = typeof shiftId === 'string' ? parseInt(shiftId) : shiftId;
                employee.schedules[i] = {
                  shiftId: parsedShiftId,
                  weekday: this.weekDays[i].weekday
                };
                console.log(`已设置员工 ${employee.name} 的第 ${i} 天排班为:`, parsedShiftId);
              } else {
                employee.schedules[i] = null;
                console.log(`员工 ${employee.name} 的第 ${i} 天没有排班`);
              }
            }
            
            formattedData.push(employee);
          } catch (itemError) {
            console.error('处理单个员工排班数据时出错:', itemError, '数据:', item);
          }
        }
        
        console.log('格式化后的排班数据:', formattedData);
        
        if (formattedData.length === 0) {
          this.$message.warning('没有找到有效的排班数据');
        } else {
          this.$message.success(`成功加载 ${formattedData.length} 名员工的排班数据`);
        }
        
        this.scheduleData = formattedData;
        // 保存原始数据的深拷贝，用于比较是否有更改
        this.originalScheduleData = JSON.parse(JSON.stringify(formattedData));
        this.hasUnsavedChanges = false;
        this.allEmployees = [...formattedData];
      }catch (error) {
        console.error('获取排班数据时发生异常:', error);
        this.$message.error('获取排班数据失败: ' + (error.message || error));
        this.scheduleData = [];
        this.originalScheduleData = [];
        this.allEmployees = [];
      } finally {
        this.loading = false;
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
    

    
    // 获取员工当前的班次ID
    getEmployeeCurrentShiftId(employeeId, dayIndex) {
      const employee = this.scheduleData.find(e => e.id === employeeId)
      if (employee && employee.schedules && employee.schedules[dayIndex]) {
        return employee.schedules[dayIndex].shiftId
      }
      return 0 // 0表示无班次（会被后端转为null）
    },
    
    // 获取班次名称
    getShiftName(shiftId) {
      // 首先检查this.shifts是否为数组
      if (!Array.isArray(this.shifts)) {
        return '班次数据加载中';
      }
      
      try {
        const shift = this.shifts.find(s => s.id === shiftId);
        return shift ? shift.name : '未知班次';
      } catch (error) {
        console.error('获取班次名称失败:', error);
        return '未知班次';
      }
    },
    
    // 获取部门名称
    getDepartmentName(departmentId) {
      const department = this.departments.find(d => d.id === departmentId)
      return department ? department.name : '未知部门'
    },
    
    // 显示员工详细信息
    showEmployeeInfo(employee) {
      this.selectedEmployee = employee;
      this.employeeInfoDialogVisible = true;
      
      // 如果员工数据中没有完整的employee对象，尝试从原始数据中获取
      if (!employee.employee && this.scheduleData) {
        const originalData = this.scheduleData.find(item => item.id === employee.id);
        if (originalData && originalData.employee) {
          this.selectedEmployee = { ...employee, employee: originalData.employee };
        }
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '无';
      return moment(dateString).format('YYYY-MM-DD');
    },
    
    // 格式化性别
    formatGender(gender) {
      switch(gender) {
        case 'male': return '男';
        case 'female': return '女';
        default: return '未设置';
      }
    },
    
    // 计算年龄
    calculateAge(birthDate) {
      if (!birthDate) return null;
      
      try {
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
          age--;
        }
        
        return age;
      } catch (error) {
        console.error('计算年龄失败:', error);
        return null;
      }
    },
    
    // 获取员工头像
    getEmployeeAvatar(employee) {
      // 如果员工有头像，返回头像URL
      if (employee && employee.employee && employee.employee.avatar) {
        return employee.employee.avatar;
      }
      
      // 否则根据性别返回默认头像
      if (employee && employee.employee && employee.employee.gender === 'female') {
        return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
      } else {
        return 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png';
      }
    },
    
    // 获取角色名称
    getRoleName(roleId) {
      if (!roleId) return '未分配角色';
      
      // 这里可以根据实际情况从后端获取角色列表
      // 或者使用预定义的角色映射
      const roleMap = {
        1: '管理员',
        2: '部门经理',
        3: '普通员工'
      };
      
      return roleMap[roleId] || '未知角色';
    },
    
    // 复制到剪贴板
    copyToClipboard(text) {
      if (!text) return;
      
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        this.$message.success('已复制到剪贴板');
      } catch (err) {
        this.$message.error('复制失败，请手动复制');
      } finally {
        document.body.removeChild(textArea);
      }
    },
    
    // 获取员工的周排班数据
    getEmployeeWeeklySchedule() {
      if (!this.selectedEmployee || !this.selectedEmployee.schedules) {
        return [];
      }
      
      return this.weekDays.map((day, index) => {
        const schedule = this.selectedEmployee.schedules[index];
        const shiftId = schedule ? schedule.shiftId : null;
        const shift = this.shifts.find(s => s.id === shiftId);
        
        return {
          weekday: day.weekday,
          shiftId: shiftId,
          shiftName: shift ? shift.name : '',
          time: shift ? this.getShiftTime(shift) : ''
        };
      });
    },
    
    // 编辑员工信息
    editEmployee() {
      if (!this.selectedEmployee || !this.selectedEmployee.id) {
        this.$message.warning('未选择员工或员工ID不存在');
        return;
      }
      
      // 跳转到用户编辑页面
      this.$router.push({
        path: '/sys/user',
        query: { editId: this.selectedEmployee.employee.id }
      });
      
      // 关闭当前对话框
      this.employeeInfoDialogVisible = false;
    },
    
    // 获取班次标签类型，用于区分不同班次
    getShiftTagType(shiftId) {
      // 首先检查this.shifts是否为数组
      if (!Array.isArray(this.shifts)) {
        return '';
      }
      
      // 找到对应的班次
      const shift = this.shifts.find(s => s.id === shiftId);
      if (!shift) return '';
      
      // 根据班次ID或名称决定标签类型
      const shiftName = shift.name.toLowerCase();
      
      // 根据班次名称关键字判断
      if (shiftName.includes('早') || shiftName.includes('morning')) {
        return 'success';
      } else if (shiftName.includes('中') || shiftName.includes('午') || shiftName.includes('noon')) {
        return 'warning';
      } else if (shiftName.includes('晚') || shiftName.includes('night')) {
        return 'danger';
      } else if (shiftName.includes('全') || shiftName.includes('full')) {
        return 'primary';
      }
      
      // 根据班次ID进行循环分配
      const types = ['', 'success', 'warning', 'danger', 'primary', 'info'];
      return types[shiftId % types.length];
    },
    
    // 获取班次时间
    getShiftTime(shiftId, dayIndex) {
      // 首先检查this.shifts是否为数组
      if (!Array.isArray(this.shifts)) {
        return '';
      }
      
      try {
        const shift = this.shifts.find(s => s.id === shiftId);
        
        // 检查shift是否存在
        if (!shift) {
          return '';
        }
        
        // 新的数据格式直接包含 startTime 和 endTime
        if (shift.startTime && shift.endTime) {
          // 处理时间格式，去除秒数部分
          const startTime = shift.startTime.substring(0, 5);
          const endTime = shift.endTime.substring(0, 5);
          return `${startTime} - ${endTime}`;
        }
        
        // 兼容旧格式
        if (Array.isArray(shift.weekSchedule) && shift.weekSchedule[dayIndex]) {
          if (shift.weekSchedule[dayIndex].enabled) {
            return `${shift.weekSchedule[dayIndex].startTime} - ${shift.weekSchedule[dayIndex].endTime}`;
          }
        }
        
        return '';
      } catch (error) {
        console.error('获取班次时间失败:', error);
        return '';
      }
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
          res = await UpdateShift(formData.id, formData)
        } else {
          // 创建班次
          res = await CreateShift(formData)
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
        
        const res = await DeleteShift(id)
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
    async assignShift(employeeId, dayIndex) {
      // 先检查班次数据是否已加载
      if (!Array.isArray(this.shifts) || this.shifts.length === 0) {
        this.$message.info('正在加载班次数据...')
        try {
          await this.fetchShifts()
          
          // 再次检查班次数据是否加载成功
          if (!Array.isArray(this.shifts) || this.shifts.length === 0) {
            this.$message.error('班次数据加载失败，请刷新页面后重试')
            return
          }
        } catch (error) {
          this.$message.error('班次数据加载失败')
          console.error(error)
          return
        }
      }
      
      // 设置表单数据
      this.assignForm = {
        employeeId,
        dayIndex,
        shiftId: null,
        date: this.weekDays[dayIndex].date
      }
      
      // 打开对话框
      this.assignDialogVisible = true
    },
    
    // 初始化周排班预览
    initWeekSchedulePreview() {
      this.weekSchedulePreview = this.weekDays.map((day, index) => ({
        day: day.weekday, // 使用weekday属性作为星期显示
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
        
        // 准备批量清除的数据
        const dayIndices = Array.from({ length: this.weekDays.length }, (_, i) => i);
        const batchScheduleData = {
          employeeIds: this.selectedEmployees.map(emp => emp.id),
          dayIndices: dayIndices,
          shiftId: null, // null表示删除排班
          departmentId: this.selectedDepartment,
          weekdays: this.weekDays.map(day => day.weekday),
          delete: true, // 添加删除标记
          clearAll: true // 标记清除所有排班
        }
        
        // 调用API批量清除排班
        const res = await SaveSchedule(batchScheduleData)
        
        if (res.code === 200) {
          // 更新本地数据
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
        } else {
          this.$message.error(res.message || '清除排班失败')
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
        
        // 准备批量保存的数据
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const savePromises = []
        
        // 为每个员工创建保存请求
        for (const employee of this.selectedEmployees) {
          // 准备班次分配数组
          const shiftAssignments = []
          
          // 遵循与表格保存相同的数据结构
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            // 如果是当前天，则设置新班次
            const day = weekdays[dayIndex]
            const shiftId = dayIndex === this.currentDayIndex ? 
              this.dayShiftForm.shiftId : 
              // 否则保持原有班次
              this.getEmployeeCurrentShiftId(employee.id, dayIndex)
            
            shiftAssignments.push({
              day,
              shiftId
            })
          }
          
          // 创建与表格保存相同的数据结构
          const scheduleData = {
            employeeId: employee.id,
            departmentId: this.selectedDepartment,
            shiftAssignments
          }
          
          // 添加到保存队列
          savePromises.push(SaveSchedule(scheduleData))
        }
        
        // 等待所有保存操作完成
        const results = await Promise.all(savePromises)
        
        // 检查结果
        const success = results.every(res => res.code === 200)
        
        if (success) {
          // 更新本地数据
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
          this.hasUnsavedChanges = true
          
          if (successCount > 0) {
            this.$message.success(`成功为 ${successCount} 名员工设置班次`)
          } else {
            this.$message.warning('没有员工被设置班次')
          }
        } else {
          this.$message.error('部分员工班次设置失败，请重试')
        }
      } catch (error) {
        this.$message.error('设置班次失败: ' + (error.message || error))
        console.error('设置班次失败:', error)
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
        
        // 准备批量保存的数据
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const savePromises = []
        
        // 为每个员工创建保存请求
        for (const employee of this.selectedEmployees) {
          // 准备班次分配数组
          const shiftAssignments = []
          
          // 遵循与表格保存相同的数据结构
          for (let i = 0; i < 7; i++) {
            // 如果是要清除的天，则设置为0（无班次）
            const day = weekdays[i]
            const shiftId = i === dayIndex ? 
              0 : // 0表示无班次（会被后端转为null）
              // 否则保持原有班次
              this.getEmployeeCurrentShiftId(employee.id, i)
            
            shiftAssignments.push({
              day,
              shiftId
            })
          }
          
          // 创建与表格保存相同的数据结构
          const scheduleData = {
            employeeId: employee.id,
            departmentId: this.selectedDepartment,
            shiftAssignments
          }
          
          // 添加到保存队列
          savePromises.push(SaveSchedule(scheduleData))
        }
        
        // 等待所有保存操作完成
        const results = await Promise.all(savePromises)
        
        // 检查结果
        const success = results.every(res => res.code === 200)
        
        if (success) {
          // 更新本地数据
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
          
          this.hasUnsavedChanges = true
          
          if (successCount > 0) {
            this.$message.success(`成功移除 ${successCount} 名员工的排班`)
          } else {
            this.$message.warning('没有员工的排班被移除')
          }
        } else {
          this.$message.error('部分员工排班移除失败，请重试')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('移除排班失败: ' + (error.message || error))
          console.error('移除排班失败:', error)
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
        this.$message.warning('请选择要应用的天数')
        return
      }
      
      try {
        // 更新预览数据
        this.groupShiftForm.applyDays.forEach(dayIndex => {
          this.$set(this.weekSchedulePreview[dayIndex], 'shiftId', this.groupShiftForm.shiftId)
        })
        
        // 准备批量保存的数据
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const savePromises = []
        
        // 为每个员工创建保存请求
        for (const employee of this.selectedEmployees) {
          // 准备班次分配数组
          const shiftAssignments = []
          
          // 遵循与表格保存相同的数据结构
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            // 如果这一天在应用天数中，则设置新班次
            const day = weekdays[dayIndex]
            const shiftId = this.groupShiftForm.applyDays.includes(dayIndex) ? 
              this.groupShiftForm.shiftId : 
              // 否则保持原有班次
              this.getEmployeeCurrentShiftId(employee.id, dayIndex)
            
            shiftAssignments.push({
              day,
              shiftId
            })
          }
          
          // 创建与表格保存相同的数据结构
          const scheduleData = {
            employeeId: employee.id,
            departmentId: this.selectedDepartment,
            shiftAssignments
          }
          
          // 添加到保存队列
          savePromises.push(SaveSchedule(scheduleData))
        }
        
        // 等待所有保存操作完成
        const results = await Promise.all(savePromises)
        
        // 检查结果
        const success = results.every(res => res.code === 200)
        
        if (success) {
          // 更新本地数据
          let successCount = 0
          
          for (const employee of this.selectedEmployees) {
            const employeeIndex = this.scheduleData.findIndex(e => e.id === employee.id)
            if (employeeIndex !== -1) {
              if (!this.scheduleData[employeeIndex].schedules) {
                this.scheduleData[employeeIndex].schedules = []
              }
              
              // 更新每一天的排班数据
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
          this.hasUnsavedChanges = true
          
          if (successCount > 0) {
            this.$message.success(`成功为 ${successCount} 名员工设置班次`)
          } else {
            this.$message.warning('没有员工被设置班次')
          }
        } else {
          this.$message.error('部分员工班次设置失败，请重试')
        }
      } catch (error) {
        this.$message.error('设置班次失败: ' + (error.message || error))
        console.error('设置班次失败:', error)
      }
    },
    
    // 确认分配班次
    confirmAssign() {
      if (!this.assignForm.shiftId) {
        this.$message.warning('请选择班次')
        return
      }
      
      try {
        // 只更新本地数据，不立即保存到服务器
        const employeeIndex = this.scheduleData.findIndex(e => e.id === this.assignForm.employeeId)
        if (employeeIndex !== -1) {
          if (!this.scheduleData[employeeIndex].schedules) {
            this.scheduleData[employeeIndex].schedules = []
          }
          
          // 更新排班数据
          this.$set(this.scheduleData[employeeIndex].schedules, this.assignForm.dayIndex, {
            shiftId: this.assignForm.shiftId,
            weekday: this.weekDays[this.assignForm.dayIndex].weekday
          })
          
          // 标记有未保存的更改
          this.hasUnsavedChanges = true
          
          this.$message.success('排班已更新，请点击保存按钮保存更改')
          this.assignDialogVisible = false
        }
      } catch (error) {
        this.$message.error('排班更新失败')
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
        
        // 只更新本地数据，不立即保存到服务器
        const employeeIndex = this.scheduleData.findIndex(e => e.id === employeeId)
        if (employeeIndex !== -1 && this.scheduleData[employeeIndex].schedules) {
          // 移除排班数据
          this.$set(this.scheduleData[employeeIndex].schedules, dayIndex, null)
          
          // 标记有未保存的更改
          this.hasUnsavedChanges = true
          
          this.$message.success('已移除排班，请点击保存按钮保存更改')
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
    },
    
    // 保存所有排班更改
    async saveAllSchedules() {
      if (!this.hasUnsavedChanges) {
        this.$message.info('没有需要保存的更改')
        return
      }
      
      try {
        this.loading = true
        
        // 按员工分组收集排班数据
        const employeeSchedules = {}
        
        // 遍历所有员工的排班数据
        for (const employee of this.scheduleData) {
          if (!employee.schedules) continue
          
          // 找到原始数据中的员工
          const originalEmployee = this.originalScheduleData.find(e => e.id === employee.id)
          
          // 检查该员工的排班是否有变化
          let hasChanges = false
          const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          const shiftAssignments = []
          
          // 遍历每一天的排班
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const currentSchedule = employee.schedules[dayIndex]
            const originalSchedule = originalEmployee && originalEmployee.schedules ? 
              originalEmployee.schedules[dayIndex] : null
            
            // 如果排班数据有变化
            if (JSON.stringify(currentSchedule) !== JSON.stringify(originalSchedule)) {
              hasChanges = true
            }
            
            // 添加到班次分配数组
            const day = weekdays[dayIndex]
            const shiftId = currentSchedule ? currentSchedule.shiftId : 0 // 0表示无班次（会被后端转为null）
            
            shiftAssignments.push({
              day,
              shiftId
            })
          }
          
          // 如果有变化，将该员工的排班添加到待保存列表
          if (hasChanges) {
            employeeSchedules[employee.id] = {
              employeeId: employee.id,
              departmentId: this.selectedDepartment,
              shiftAssignments
            }
          }
        }
        
        const employeeIds = Object.keys(employeeSchedules)
        
        if (employeeIds.length === 0) {
          this.$message.info('没有需要保存的更改')
          this.loading = false
          return
        }
        
        console.log('准备保存的排班数据:', employeeSchedules)
        
        // 保存每个员工的排班
        const savePromises = employeeIds.map(id => {
          return SaveSchedule(employeeSchedules[id])
        })
        
        // 等待所有保存操作完成
        const results = await Promise.all(savePromises)
        
        // 检查结果
        const success = results.every(res => res.code === 200)
        
        if (success) {
          this.$message.success('所有排班更改已保存')
          // 更新原始数据
          this.originalScheduleData = JSON.parse(JSON.stringify(this.scheduleData))
          this.hasUnsavedChanges = false
          
          // 重新加载排班数据
          await this.fetchScheduleData()
        } else {
          this.$message.warning('部分排班更改保存失败，请重试')
        }
      } catch (error) {
        console.error('保存排班更改失败:', error)
        this.$message.error('保存排班更改失败')
      } finally {
        this.loading = false
      }
    },
    
    // 放弃所有排班更改
    discardAllChanges() {
      if (!this.hasUnsavedChanges) {
        this.$message.info('没有需要放弃的更改')
        return
      }
      
      this.$confirm('确定要放弃所有未保存的排班更改吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 恢复原始数据
        this.scheduleData = JSON.parse(JSON.stringify(this.originalScheduleData))
        this.hasUnsavedChanges = false
        this.$message.success('已放弃所有更改')
      }).catch(() => {
        // 用户取消操作
      })
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

.schedule-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 10px;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

/* 优化排班表格样式 */
.shift-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.shift-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.shift-badge {
  display: flex;
  align-items: center;
}

.shift-badge .el-tag {
  font-weight: 500;
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.delete-btn {
  margin-left: 5px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.delete-btn:hover {
  opacity: 1;
}

/* 表格悬停效果 */
.el-table__row:hover .shift-cell {
  background-color: rgba(236, 245, 255, 0.2);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .shift-badge .el-tag {
    max-width: 60px;
    font-size: 11px;
  }
  
  .delete-btn {
    padding: 4px;
  }
}

/* 员工信息对话框样式 */
.employee-info-dialog .el-dialog__body {
  padding: 20px;
}

.employee-info {
  padding: 0;
}

.employee-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.employee-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20px;
  border: 2px solid #eaeaea;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.employee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-title {
  flex: 1;
}

.employee-title h2 {
  margin: 0 0 10px 0;
  font-size: 22px;
  color: #303133;
}

.employee-tags {
  display: flex;
  gap: 8px;
}

.employee-info .el-descriptions {
  margin-bottom: 20px;
}

.employee-info .el-divider__text {
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
}

.info-value {
  color: #606266;
}

.contact-value {
  display: flex;
  align-items: center;
}

.contact-value .el-button {
  margin-left: 8px;
  padding: 2px;
}

.weekly-schedule-summary {
  margin-top: 15px;
}

.weekly-schedule-summary .el-table {
  margin-bottom: 15px;
}

.employee-info .el-descriptions-item__label {
  width: 100px;
  font-weight: bold;
  color: #606266;
}

.employee-info .el-descriptions-item__content {
  color: #303133;
}
</style>