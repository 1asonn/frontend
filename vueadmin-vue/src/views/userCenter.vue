<template>
  <div class="user-center-container">
    <el-row :gutter="20">
      <!-- 左侧用户信息卡片 -->
      <el-col :span="8">
        <el-card class="user-info-card" shadow="hover">
          <div slot="header" class="card-header">
            <span>个人信息</span>
            <el-button type="text" icon="el-icon-edit" @click="showEditUserInfoDialog">编辑</el-button>
          </div>
          <div v-if="userInfo" class="user-profile">
            <div class="avatar-container">
              <el-avatar :size="100" icon="el-icon-user-solid"></el-avatar>
              <div class="user-status" :class="userInfo.status === 'online' ? 'online' : 'offline'">
                {{ userInfo.status === 'online' ? '在线' : '离线' }}
              </div>
            </div>
            <div class="user-details">
              <h2>{{ userInfo.realname || '未设置姓名' }}</h2>
              <p class="user-role">{{ userInfo.role && userInfo.role.role_name || '未分配角色' }}</p>
              <div class="info-item">
                <i class="el-icon-user"></i>
                <span>{{ userInfo.username || '未设置用户名' }}</span>
              </div>
              <div class="info-item">
                <i class="el-icon-office-building"></i>
                <span>{{ userInfo.department && userInfo.department.name || '未分配科室' }}</span>
              </div>
              <div class="info-item">
                <i class="el-icon-phone"></i>
                <span>{{ userInfo.phone || '未设置手机号' }}</span>
              </div>
              <div class="info-item">
                <i class="el-icon-date"></i>
                <span>{{ userInfo.birth_date || '未设置出生日期' }}</span>
              </div>
              <div class="info-item">
                <i class="el-icon-location"></i>
                <span>{{ userInfo.address || '未设置地址' }}</span>
              </div>
            </div>
          </div>
        </el-card>


      </el-col>

      <!-- 右侧内容区 -->
      <el-col :span="16">
        <!-- 排班信息卡片 -->
        <el-card class="schedule-card" shadow="hover">
          <div slot="header" class="card-header">
            <span>我的排班</span>
            <div>
              <el-button type="text" icon="el-icon-refresh" @click="refreshSchedule">刷新</el-button>
              <el-button type="text" icon="el-icon-printer" @click="printSchedule">打印</el-button>
            </div>
          </div>
          <div class="schedule-container" ref="scheduleContainer">
            <Calendar :schedule-data="scheduleData" :key="scheduleRefreshKey"></Calendar>
          </div>
        </el-card>


      </el-col>
    </el-row>

    <!-- 编辑用户信息对话框 -->
    <el-dialog title="编辑个人信息" :visible.sync="editUserInfoVisible" width="50%">
      <el-form :model="editUserForm" :rules="userInfoRules" ref="editUserForm" label-width="100px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="handleAvatarUpload"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload">
            <img v-if="editUserForm.avatar" :src="editUserForm.avatar" class="avatar-preview">
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </el-upload>
        </el-form-item>
        <el-form-item label="姓名" prop="realname">
          <el-input v-model="editUserForm.realname" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editUserForm.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker
            v-model="editUserForm.birthDate"
            type="date"
            placeholder="选择出生日期"
            value-format="yyyy-MM-dd">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="editUserForm.address" placeholder="请输入地址"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editUserInfoVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitUserInfoForm" :loading="userInfoLoading">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import Calendar from '../components/Calendar.vue'
import { GetCurrentSchedule } from '../api/schedule.js'
import {GetUserInfo} from '../api/index.js'

export default {
    components:{
        Calendar
    },
    
    data(){
        return{
            // 用户信息
            userInfo: null,
            // 编辑用户信息
            editUserInfoVisible: false,
            editUserForm: {
                avatar: '',
                realname: '',
                phone: '',
                birth_date: '',
                address: ''
            },
            userInfoLoading: false,
            userInfoRules: {
                realname: [
                    { required: true, message: '请输入姓名', trigger: 'blur' }
                ],
                phone: [
                    { required: true, message: '请输入手机号', trigger: 'blur' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
                ]
            },
            // 排班相关
            scheduleData: {},
            scheduleRefreshKey: 0,

        }
    },
    computed: {
    },
    created(){
        this.getUserInfo();
        this.getScheduleData()
    },
    methods:{
        // 获取用户信息
        async getUserInfo() {
            try {
                // 从 token 中获取用户ID
                const token = localStorage.getItem('token');
                if (!token) {
                    this.$message.error('未登录或登录已过期，请重新登录');
                    return;
                }
                
                // 解析 token 获取用户ID
                // JWT token 格式为: header.payload.signature
                // 我们需要解析 payload 部分
                let userId;
                try {
                    const payload = token.split('.')[1];
                    const decodedPayload = JSON.parse(atob(payload));
                    userId = decodedPayload.userId || decodedPayload.id || decodedPayload.sub;
                    
                    if (!userId) {
                        // 如果从 token 中无法获取 userId，尝试从 localStorage 中获取
                        userId = localStorage.getItem('userId');
                    }
                    
                    if (!userId) {
                        throw new Error('无法获取用户ID');
                    }
                } catch (error) {
                    console.error('解析 token 失败:', error);
                    // 如果解析失败，尝试从 localStorage 中获取
                    userId = localStorage.getItem('userId');
                    
                    if (!userId) {
                        // 如果还是无法获取，使用默认值
                        userId = '1'; // 默认用户ID，开发环境下使用
                        console.warn('使用默认用户ID:', userId);
                    }
                }
                
                // 调用获取用户信息的API
                const response = await GetUserInfo(userId);
                console.log("this is res",response)
                if (response) {
                    // 更新用户信息
                    this.userInfo = {
                        ...response,
                        status: 'online' // 默认设置为在线
                    };
                    console.log("this is userInfo",this.userInfo)
                    
                    // 初始化编辑表单
                    this.editUserForm = {
                        realname: this.userInfo.realname || '',
                        phone: this.userInfo.phone || '',
                        birth_date: this.userInfo.birth_date || '',
                        address: this.userInfo.address || ''
                    };
                } else {
                    this.$message.error('获取用户信息失败');
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
                this.$message.error('获取用户信息失败');
            }
        },
        
        // 获取排班数据
        async getScheduleData(){
            try {
                const response = await GetCurrentSchedule()
                console.log("schedule", response)
                
                // 注意：API返回格式变化，现在response直接是数据对象
                if (response && response.data) {
                    // 处理新的API返回格式
                    console.log('排班数据:', response.data);
                    
                    if (response.data.detailed_shift_mapping) {
                        // 使用详细的班次信息
                        const scheduleData = {};
                        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        
                        weekdays.forEach(day => {
                            const shiftInfo = response.data.detailed_shift_mapping[day];
                            if (shiftInfo) {
                                // 如果有班次信息，使用timeRange字段
                                scheduleData[day] = {
                                    timeRange: shiftInfo.timeRange,
                                    name: shiftInfo.name,
                                    description: shiftInfo.description,
                                    id: shiftInfo.id
                                };
                            } else {
                                // 如果没有班次信息，设置为休息
                                scheduleData[day] = null;
                            }
                        });
                        
                        this.scheduleData = scheduleData;
                    } else {
                        // 兼容旧格式
                        const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = response.data;
                        this.scheduleData = { monday, tuesday, wednesday, thursday, friday, saturday, sunday };
                    }
                    
                    this.$message.success('排班信息加载成功');
                    this.scheduleRefreshKey++; // 强制刷新日历组件
                } else {
                    this.$message.warning('没有找到排班信息');
                    this.scheduleData = {};
                }
            } catch (error) {
                console.error('获取排班失败:', error)
                this.$message.error('获取排班信息失败');
                this.scheduleData = {};
            }
        },
        
        // 刷新排班数据
        refreshSchedule() {
            this.getScheduleData();
            this.scheduleRefreshKey++;
            this.$message.success('排班数据已刷新');
        },
        
        // 打印排班表
        printSchedule() {
            const printWindow = window.open('', '_blank');
            printWindow.document.write('<html><head><title>我的排班表</title>');
            printWindow.document.write('<style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:center;}th{background-color:#f2f2f2;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write('<h1>我的排班表</h1>');
            printWindow.document.write('<div>' + this.$refs.scheduleContainer.innerHTML + '</div>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        },
        

        
        // 显示编辑用户信息对话框
        showEditUserInfoDialog() {
            this.editUserInfoVisible = true;
        },
        
        // 提交用户信息表单
        submitUserInfoForm() {
            this.$refs.editUserForm.validate(async (valid) => {
                if (valid) {
                    this.userInfoLoading = true;
                    try {
                        // 这里应该调用更新用户信息的API
                        // await UpdateUserInfo(this.editUserForm);
                        
                        // 模拟API调用
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // 更新本地用户信息
                        this.userInfo = {
                            ...this.userInfo,
                            ...this.editUserForm
                        };
                        
                        this.editUserInfoVisible = false;
                        this.$message.success('个人信息更新成功');
                    } catch (error) {
                        console.error('更新用户信息失败:', error);
                        this.$message.error('更新用户信息失败');
                    } finally {
                        this.userInfoLoading = false;
                    }
                }
            });
        },
        
        // 头像上传前验证
        beforeAvatarUpload(file) {
            const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
            const isLt2M = file.size / 1024 / 1024 < 2;
            
            if (!isJPG) {
                this.$message.error('头像图片只能是JPG或PNG格式!');
            }
            if (!isLt2M) {
                this.$message.error('头像图片大小不能超过2MB!');
            }
            return isJPG && isLt2M;
        },
        
        // 处理头像上传
        handleAvatarUpload(options) {
            const file = options.file;
            // 这里应该调用上传头像的API
            // 由于没有具体的API，这里使用FileReader模拟
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // this.editUserForm.avatar = reader.result;
            };
        },
        

    }
}

</script>

<style scoped>
/* 全局容器样式 */
.user-center-container {
  padding: 20px;
  background-color: var(--bg-color, #f5f7fa);
}

/* 卡片共用样式 */
.el-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: var(--box-shadow, 0 2px 12px 0 rgba(0, 0, 0, 0.1)) !important;
  transition: all 0.3s;
}

.el-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-hover, 0 6px 16px 0 rgba(0, 0, 0, 0.2)) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 用户信息卡片样式 */
.user-info-card {
  height: 100%;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.avatar-container {
  position: relative;
  margin-bottom: 20px;
}

.user-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  color: white;
  padding: 2px;
}

.online {
  background-color: #67c23a;
}

.offline {
  background-color: #909399;
}

.user-details {
  width: 100%;
  text-align: center;
}

.user-details h2 {
  margin: 0 0 5px 0;
  font-size: 1.5rem;
  color: var(--text-primary, #303133);
}

.user-role {
  color: var(--text-secondary, #606266);
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.info-item {
  display: flex;
  align-items: center;
  margin: 10px 0;
  padding: 8px;
  border-radius: 4px;
  background-color: var(--bg-light, #f8f9fa);
  transition: background-color 0.3s;
}

.info-item:hover {
  background-color: var(--bg-hover, #ecf5ff);
}

.info-item i {
  margin-right: 10px;
  color: var(--primary-color, #409EFF);
}



/* 排班卡片样式 */
.schedule-card {
  margin-bottom: 20px;
}

.schedule-container {
  padding: 10px;
}



/* 头像上传样式 */
.avatar-uploader {
  text-align: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.avatar-uploader .el-upload:hover {
  border-color: var(--primary-color, #409EFF);
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
  border-radius: 50%;
}

/* 日历组件样式 */
:deep(.fc) {
  width: 100%;
  height: 500px;
  margin-bottom: 20px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .el-row {
    display: flex;
    flex-direction: column;
  }
  
  .el-col {
    width: 100% !important;
  }
  
  .info-item {
    font-size: 0.9rem;
  }
  
  :deep(.fc) {
    height: 400px;
  }
}
</style>