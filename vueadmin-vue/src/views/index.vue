<template>
  <div class="home">
     <!-- 顶部统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="icon blue">
              <i class="el-icon-user"></i>
            </div>
            <div class="info">
              <div class="title">今日门诊量</div>
              <div class="value">{{ todayPatients }}</div>
              <div class="compare">较昨日 
                <span :class="patientTrend > 0 ? 'up' : 'down'">
                   {{ Math.abs(patientTrend) }}%
                  <i :class="patientTrend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="icon green">
              <i class="el-icon-first-aid-kit"></i>
            </div>
            <div class="info">
              <div class="title">住院床位使用率</div>
              <div class="value">{{ bedUsage }}%</div>
              <div class="compare">剩余床位：{{ availableBeds }}个</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="icon orange">
              <i class="el-icon-medicine-box"></i>
            </div>
            <div class="info">
              <div class="title">药品库存预警</div>
              <div class="value">{{ stockAlerts.total }}种</div>
              <div class="compare">
                <template v-if="stockAlerts.critical_count > 0">
                  其中{{ stockAlerts.critical_count }}个紧急
                </template>
                <template v-else>
                  {{ stockAlerts.warning_count }}个普通预警
                </template>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="icon purple">
              <i class="el-icon-cpu"></i>
            </div>
            <div class="info">
              <div class="title">设备维护提醒</div>
              <div class="value">{{ maintenanceCount }}台</div>
              <div class="compare">需要维护的设备数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
 
     <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header">
            <span>近7天就诊趋势</span>
          </div>
          <div class="chart" ref="weeklyPatients"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header">
            <span>各科室今日挂号统计</span>
          </div>
          <div class="chart" ref="departmentStats"></div>
        </el-card>
      </el-col>
    </el-row>
 
     <!-- 通知和待办 -->
    <el-row :gutter="20" class="bottom-row">
      <!-- 药品库存预警 -->
      <el-col :span="12">
        <el-card class="alert-card">
          <div slot="header">
            <span>药品库存预警</span>
            <el-radio-group v-model="alertFilter" size="small" style="float: right">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="critical">紧急</el-radio-button>
              <el-radio-button label="warning">警告</el-radio-button>
            </el-radio-group>
          </div>
          <el-table :data="filteredAlerts" style="width: 100%">
            <el-table-column prop="medicine_name" label="药品名称" width="120"></el-table-column>
            <el-table-column label="预警类型" width="100">
              <template slot-scope="scope">
                <el-tag :type="scope.row.type === 'expiring_soon' ? 'warning' : 'danger'">
                  {{ scope.row.type === 'expiring_soon' ? '近效期' : '低库存' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="预警等级" width="100">
              <template slot-scope="scope">
                <el-tag :type="scope.row.level === 'critical' ? 'danger' : 'warning'">
                  {{ scope.row.level === 'critical' ? '紧急' : '警告' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="预警信息"></el-table-column>
            <el-table-column label="操作" width="100">
              <template slot-scope="scope">
                <el-button 
                  type="text" 
                  @click="handleAlertAction(scope.row)"
                  :type="scope.row.level === 'critical' ? 'danger' : 'warning'">
                  处理
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="notice-card">
          <div slot="header">
            <span>系统通知</span>
            <el-button style="float: right; padding: 3px 0" type="text">查看全部</el-button>
          </div>
          <div class="notice-list">
            <el-timeline>
              <el-timeline-item
                 v-for="(notice, index) in notices"
                 :key="index"
                 :timestamp="notice.time"
                 :type="notice.type">
                 {{ notice.content }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="todo-card">
          <div slot="header">
            <span>待办事项</span>
            <el-button style="float: right; padding: 3px 0" type="text">查看全部</el-button>
          </div>
          <el-table :data="todos" style="width: 100%">
            <el-table-column prop="title" label="事项"></el-table-column>
            <el-table-column prop="deadline" label="截止时间" width="180"></el-table-column>
            <el-table-column prop="priority" label="优先级" width="100">
              <template slot-scope="scope">
                <el-tag :type="scope.row.priority === '高' ? 'danger' : scope.row.priority === '中' ? 'warning' : 'info'">
                   {{ scope.row.priority }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
 </template>
 
 <script>
 import * as echarts from 'echarts'
 import { GetMedicineStockAlerts } from '@/api/index'

 export default {
   name: 'Home',
   data() {
     return {
       // 统计数据
       todayPatients: 286,
       patientTrend: 5.2,
       bedUsage: 85,
       availableBeds: 45,
       maintenanceCount: 8,

       // 药品库存预警
       stockAlerts: {
         total: 0,
         critical_count: 0,
         warning_count: 0,
         alerts: []
       },
       alertFilter: 'all',

       // 通知列表
       notices: [
         {
           content: '急诊科设备检修完成',
           time: '10分钟前',
           type: 'success'
         },
         {
           content: '新冠疫苗补货已到达',
           time: '30分钟前',
           type: 'info'
         },
         {
           content: '下午2点医务会议',
           time: '1小时前',
           type: 'warning'
         },
         {
           content: '心电图机器需要维护',
           time: '2小时前',
           type: 'danger'
         }
       ],

       // 待办事项
       todos: [
         {
           title: '更新医疗设备维护记录',
           deadline: '2025-03-25 12:00',
           priority: '高'
         },
         {
           title: '审核药品采购清单',
           deadline: '2025-03-26 15:00',
           priority: '中'
         },
         {
           title: '完成月度工作报告',
           deadline: '2025-03-28 18:00',
           priority: '低'
         }
       ],
     }
   },
   computed: {
     filteredAlerts() {
       if (this.alertFilter === 'all') {
         return this.stockAlerts.alerts
       } else {
         return this.stockAlerts.alerts.filter(alert => alert.level === this.alertFilter)
       }
     }
   },
   mounted() {
     this.$nextTick(() => {
       this.initWeeklyChart()
       this.initDepartmentChart()
       this.getMedicineStockAlerts()
     })
   },
   methods: {
     initWeeklyChart() {
       const chart = echarts.init(this.$refs.weeklyPatients)
       const option = {
         tooltip: {
           trigger: 'axis'
         },
         xAxis: {
           type: 'category',
           data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
         },
         yAxis: {
           type: 'value'
         },
         series: [{
           data: [250, 280, 270, 340, 260, 220, 286],
           type: 'line',
           smooth: true,
           areaStyle: {
             opacity: 0.3
           }
         }]
       }
       chart.setOption(option)
     },
     initDepartmentChart() {
       const chart = echarts.init(this.$refs.departmentStats)
       const option = {
         tooltip: {
           trigger: 'item'
         },
         legend: {
           orient: 'vertical',
           left: 'left'
         },
         series: [{
           type: 'pie',
           radius: '50%',
           data: [
             { value: 78, name: '内科' },
             { value: 65, name: '外科' },
             { value: 45, name: '儿科' },
             { value: 35, name: '妇科' },
             { value: 28, name: '眼科' },
             { value: 35, name: '其他' }
           ],
           emphasis: {
             itemStyle: {
               shadowBlur: 10,
               shadowOffsetX: 0,
               shadowColor: 'rgba(0, 0, 0, 0.5)'
             }
           }
         }]
       }
       chart.setOption(option)
     },
     getMedicineStockAlerts() {
       GetMedicineStockAlerts().then(response => {
         this.stockAlerts.total = response.data.total
         this.stockAlerts.critical_count = response.data.critical_count
         this.stockAlerts.warning_count = response.data.warning_count
         this.stockAlerts.alerts = response.data.alerts
       })
     },
     handleAlertAction(alert) {
       // 根据预警类型跳转到不同页面
       if (alert.type === 'low_stock') {
         this.$router.push({
           path: '/pharmacy/inventory',
           query: { medicineId: alert.medicine_id }
         })
       } else if (alert.type === 'expiring_soon') {
         this.$router.push({
           path: '/pharmacy/medicines',
           query: { 
             medicineId: alert.medicine_id,
             stockId: alert.stock_id 
           }
         })
       }
     }
   }
 }
 </script>
 
 <style scoped>
 .home {
   padding: 20px;
 }
 
 .stats-cards {
   margin-bottom: 20px;
 }
 
 .stat-item {
   display: flex;
   align-items: center;
 }
 
 .icon {
   width: 80px;
   height: 80px;
   border-radius: 50%;
   display: flex;
   align-items: center;
   justify-content: center;
   margin-right: 20px;
 }
 
 .icon i {
   font-size: 40px;
   color: #fff;
 }
 
 .blue { background-color: #409EFF; }
 .green { background-color: #67C23A; }
 .orange { background-color: #E6A23C; }
 .purple { background-color: #909399; }
 
 .info .title {
   font-size: 14px;
   color: #909399;
   margin-bottom: 10px;
 }
 
 .info .value {
   font-size: 24px;
   font-weight: bold;
   margin-bottom: 5px;
 }
 
 .info .compare {
   font-size: 12px;
   color: #909399;
 }
 
 .compare .up {
   color: #F56C6C;
 }
 
 .compare .down {
   color: #67C23A;
 }
 
 .charts-row {
   margin-bottom: 20px;
 }
 
 .chart-card {
   margin-bottom: 20px;
 }
 
 .chart {
   height: 300px;
 }
 
 .notice-card, .todo-card, .alert-card {
   height: 400px;
 }
 
 .notice-list {
   height: 320px;
   overflow-y: auto;
 }
 
 .bottom-row {
   margin-bottom: 20px;
 }
 </style>