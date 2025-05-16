<template>
  <div>
    <el-container class="app-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar-container">
      <div class="logo-container">
        <img src="@/assets/医院.png" alt="Logo" class="logo-image" v-if="!isCollapse">
        <img src="@/assets/医院.png" alt="Logo" class="logo-small" v-else>
      </div>
      <el-button 
        type="text" 
        class="toggle-button" 
        @click="toggleSidebar"
        :title="isCollapse ? '展开菜单' : '收起菜单'">
        <i :class="isCollapse ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
      </el-button>
      <SideMenu :is-collapse="isCollapse"></SideMenu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="app-header" height="60px">
        <div class="header-left">
          <h2 class="system-title">医院信息管理系统</h2>
          <!-- <el-tag size="small" type="success" class="env-tag">{{ currentEnv }}</el-tag> -->
        </div>

        <div class="header-right">
          <!-- 全局搜索 -->
          <el-autocomplete
            class="global-search"
            v-model="searchQuery"
            :fetch-suggestions="querySearch"
            placeholder="搜索功能、设备或用户"
            @select="handleSelect"
            prefix-icon="el-icon-search">
          </el-autocomplete>

          <!-- 通知图标 -->
          <el-badge :value="notificationCount" :max="99" class="notification-badge">
            <el-button type="text" icon="el-icon-bell" @click="showNotifications"></el-button>
          </el-badge>

          <!-- 用户信息 -->
          <div class="user-info">
            <el-avatar :size="36" :src="userInfo.avatar || defaultAvatar"></el-avatar>
            <el-dropdown trigger="click">
              <span class="el-dropdown-link">
                {{ userInfo.realname || userInfo.username }}<i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <router-link to="/userCenter">
                  <el-dropdown-item>
                    <i class="el-icon-user"></i> 个人中心
                  </el-dropdown-item>
                </router-link>
                <el-dropdown-item divided @click.native="showThemeDialog">
                  <i class="el-icon-brush"></i> 主题设置
                </el-dropdown-item>
                <el-dropdown-item @click.native="logout">
                  <i class="el-icon-switch-button"></i> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <!-- 标签页导航 -->
      <div class="tabs-container">
        <Tabs></Tabs>
      </div>
      
      <!-- 主内容区 -->
      <el-main class="app-main">
        <transition name="fade-transform" mode="out-in">
          <router-view />
        </transition>
      </el-main>

      <!-- 页脚 -->
      <el-footer height="40px" class="app-footer">
        <div class="footer-content">
          <span>© {{ currentYear }} 医院信息管理系统</span>
          <span>版本: v1.2.0</span>
        </div>
      </el-footer>
    </el-container>
  </el-container>

  <!-- 通知抽屉 -->
  <el-drawer
    title="系统通知"
    :visible.sync="notificationDrawer"
    direction="rtl"
    size="30%">
    <div class="notification-container">
      <div v-if="notifications.length === 0" class="empty-notifications">
        <i class="el-icon-bell"></i>
        <p>暂无通知</p>
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="(notification, index) in notifications"
          :key="index"
          :type="notification.type"
          :color="notification.color"
          :timestamp="notification.time">
          {{ notification.content }}
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-drawer>

  <!-- 主题设置对话框 -->
  <el-dialog
    title="主题设置"
    :visible.sync="themeDialogVisible"
    width="30%">
    <div class="theme-settings">
      <div class="theme-item">
        <span>主题色调</span>
        <el-color-picker v-model="themeColor" @change="changeTheme"></el-color-picker>
      </div>
      <div class="theme-item">
        <span>深色模式</span>
        <el-switch v-model="darkMode" @change="toggleDarkMode"></el-switch>
      </div>
      <div class="theme-item">
        <span>紧凑模式</span>
        <el-switch v-model="compactMode" @change="toggleCompactMode"></el-switch>
      </div>
    </div>
  </el-dialog>
</div>
</template>


<script>
import SideMenu from "./inc/SideMenu.vue"
import Tabs from "./inc/Tabs.vue"
import { GetMenuPublicKey } from '@/api/index'
import { getCurrentUser } from '@/utils/auth'

export default {
  name: "Home",
  components: {
    SideMenu,
    Tabs
  },
  data() {
    return {
      // 用户信息
      userInfo: {
        id: "",
        avatar: "",
        username: "",
        realname: ""
      },
      defaultAvatar: "https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png",
      
      // 侧边栏状态
      isCollapse: false,
      
      // 全局搜索
      searchQuery: "",
      searchResults: [],
      
      // 通知相关
      notificationCount: 0,
      notificationDrawer: false,
      notifications: [],
      
      // 主题设置
      themeDialogVisible: false,
      themeColor: "#409EFF",
      darkMode: false,
      compactMode: false,
      
      // 当前环境信息
      currentEnv: process.env.NODE_ENV === 'production' ? '生产环境' : '开发环境'
    }
  },
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  },
  methods: {
    // 菜单公钥设置
    setMenuPublicKey() {
      GetMenuPublicKey().then(res => {
        this.$store.commit("setMenuPublicKey", res)
      }).catch(error => {
        console.error('获取菜单公钥失败:', error)
      })
    },
    
    // 获取当前用户信息
    getUserInfo() {
      const user = getCurrentUser()
      if (user) {
        this.userInfo = {
          id: user.userId || user.id,
          username: user.username || '',
          realname: user.realname || '',
          avatar: user.avatar || this.defaultAvatar
        }
      }
    },
    
    // 收起/展开侧边栏
    toggleSidebar() {
      this.isCollapse = !this.isCollapse
      // 存储用户偏好
      localStorage.setItem('sidebarStatus', this.isCollapse ? '1' : '0')
    },
    
    // 全局搜索功能
    querySearch(queryString, cb) {
      // 这里可以调用后端接口进行搜索，这里模拟一些数据
      const results = [
        { value: '设备管理', link: '/sys/equipment' },
        { value: '维修工单', link: '/sys/maintenance' },
        { value: '用户管理', link: '/sys/user' },
        { value: '科室管理', link: '/sys/department' }
      ].filter(item => {
        return item.value.toLowerCase().includes(queryString.toLowerCase())
      })
      
      cb(results)
    },
    
    // 处理搜索选择
    handleSelect(item) {
      if (item.link) {
        this.$router.push(item.link)
      }
      this.searchQuery = ''
    },
    
    // 显示通知抽屉
    showNotifications() {
      // 模拟获取通知数据
      this.fetchNotifications()
      this.notificationDrawer = true
      // 清除未读通知计数
      this.notificationCount = 0
    },
    
    // 获取通知数据
    fetchNotifications() {
      // 这里可以调用后端接口获取通知，这里模拟数据
      // 实际开发时可以替换为真实的API调用
      setTimeout(() => {
        this.notifications = [
          {
            content: '有新的维修工单待处理',
            time: '10分钟前',
            type: 'warning',
            color: '#E6A23C'
          },
          {
            content: '系统将于今晚22:00进行维护升级',
            time: '30分钟前',
            type: 'info',
            color: '#909399'
          }
        ]
      }, 300)
    },
    
    // 定时获取通知数量
    startNotificationTimer() {
      // 每分钟查询一次新通知
      this.notificationTimer = setInterval(() => {
        // 这里可以调用后端接口获取未读通知数量
        // 这里模拟随机生成通知
        if (Math.random() > 0.7) {
          this.notificationCount += 1
        }
      }, 60000)
    },
    
    // 显示主题设置对话框
    showThemeDialog() {
      this.themeDialogVisible = true
    },
    
    // 更改主题色
    changeTheme(color) {
      // 更新CSS变量
      document.documentElement.style.setProperty('--theme-color', color)
      // 保存到本地存储
      localStorage.setItem('themeColor', color)
    },
    
    // 切换深色模式
    toggleDarkMode(value) {
      if (value) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
      localStorage.setItem('darkMode', value ? '1' : '0')
    },
    
    // 切换紧凑模式
    toggleCompactMode(value) {
      if (value) {
        document.body.classList.add('compact-mode')
      } else {
        document.body.classList.remove('compact-mode')
      }
      localStorage.setItem('compactMode', value ? '1' : '0')
    },
    
    // 加载用户偏好设置
    loadUserPreferences() {
      // 侧边栏状态
      const sidebarStatus = localStorage.getItem('sidebarStatus')
      if (sidebarStatus) {
        this.isCollapse = sidebarStatus === '1'
      }
      
      // 主题色
      const savedThemeColor = localStorage.getItem('themeColor')
      if (savedThemeColor) {
        this.themeColor = savedThemeColor
        this.changeTheme(savedThemeColor)
      }
      
      // 深色模式
      const darkMode = localStorage.getItem('darkMode')
      if (darkMode) {
        this.darkMode = darkMode === '1'
        this.toggleDarkMode(this.darkMode)
      }
      
      // 紧凑模式
      const compactMode = localStorage.getItem('compactMode')
      if (compactMode) {
        this.compactMode = compactMode === '1'
        this.toggleCompactMode(this.compactMode)
      }
    },
    
    // 退出登录
    logout() {
      this.$confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 保存用户凭据（如果存在）
        const userCredentials = localStorage.getItem('userCredentials')
        
        // 清除其他存储数据
        localStorage.clear()
        sessionStorage.clear()
        
        // 如果之前有保存的用户凭据，则恢复它
        if (userCredentials) {
          localStorage.setItem('userCredentials', userCredentials)
        }
        
        this.$store.commit("resetState")
        this.$message.success('已安全退出系统')
        this.$router.push("/login")
      }).catch(() => {
        // 取消退出
      })
    }
  },
  created() {
    // 获取菜单公钥
    this.setMenuPublicKey()
    
    // 获取用户信息
    this.getUserInfo()
    
    // 加载用户偏好设置
    this.loadUserPreferences()
    
    // 启动通知定时器
    this.startNotificationTimer()
    
    // 模拟初始通知数
    this.notificationCount = 2
  },
  beforeDestroy() {
    // 清除定时器
    if (this.notificationTimer) {
      clearInterval(this.notificationTimer)
    }
  }
}
</script>


<style>
/* 全局变量 */
:root {
  --theme-color: #409EFF;
  --sidebar-width: 220px;
  --sidebar-collapsed-width: 64px;
  --header-height: 60px;
  --footer-height: 40px;
  --transition-duration: 0.3s;
  --border-radius: 8px;
  --box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  --hover-transition: all 0.3s ease;
}

/* 深色模式 */
body.dark-mode {
  --bg-color: #1f1f1f;
  --text-color: #f0f0f0;
  --sidebar-bg: #2b2b2b;
  --header-bg: #2b2b2b;
  --main-bg: #1a1a1a;
  --border-color: #3e3e3e;
  --hover-color: #363636;
  --card-bg: #2b2b2b;
}

/* 深色模式全局样式覆盖 */
body.dark-mode .app-container {
  background-color: var(--bg-color);
  color: var(--text-color);
}

body.dark-mode .sidebar-container {
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
}

body.dark-mode .app-header {
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
}

body.dark-mode .app-main {
  background-color: var(--main-bg);
}

body.dark-mode .app-footer {
  background-color: var(--header-bg);
  border-top: 1px solid var(--border-color);
  color: var(--text-color);
}

/* 紧凑模式 */
body.compact-mode .app-header {
  height: 50px;
  line-height: 50px;
}

body.compact-mode .system-title {
  font-size: 18px;
}

body.compact-mode .app-main {
  padding: 10px;
}

body.compact-mode .el-form-item {
  margin-bottom: 12px;
}

body.compact-mode .el-card {
  margin-bottom: 10px;
}

/* 响应式布局 */
/* @media screen and (max-width: 768px) {
  .sidebar-container {
    position: fixed;
    z-index: 1000;
    transform: translateX(-100%);
    
  }
  
  .sidebar-container.show {
    transform: translateX(0);
  }
  
  .main-container {
    margin-left: 0 !important;
  }
  
  .global-search {
    width: 150px;
  }
  
  .header-right {
    gap: 10px;
  }
} */
</style>

<style scoped>
/* 布局容器 */
.app-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f0f2f5;
}

/* 侧边栏 */
.sidebar-container {
  height: 100%;
  background: linear-gradient(180deg, #304156 0%, #1f2d3d 100%);
  box-shadow: var(--box-shadow);
  position: relative;
  z-index: 10;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-container {
  height: 60px;
  padding: 10px 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.logo-image {
  height: 40px;
  max-width: 180px;
  transition: var(--hover-transition);
}

.logo-small {
  height: 32px;
  width: 32px;
  transition: var(--hover-transition);
}

.toggle-button {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: var(--hover-transition);
  backdrop-filter: blur(4px);
}

.toggle-button:hover {
  background-color: var(--theme-color);
  transform: translateX(-50%) scale(1.1);
}

/* 主内容区 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition-duration);
  overflow: hidden;
  height: 100vh;
}

/* 顶部导航栏 */
.app-header {
  height: var(--header-height);
  line-height: var(--header-height);
  background-color: #fff;
  color: #333;
  box-shadow: var(--box-shadow);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 9;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.system-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  background: linear-gradient(45deg, var(--theme-color), #36cfc9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.env-tag {
  margin-left: 10px;
  border-radius: var(--border-radius);
  padding: 0 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.global-search {
  width: 250px;
}

.global-search :deep(.el-input__inner) {
  border-radius: var(--border-radius);
  transition: var(--hover-transition);
}

.global-search :deep(.el-input__inner:focus) {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.notification-badge {
  cursor: pointer;
  transition: var(--hover-transition);
}

.notification-badge:hover {
  transform: scale(1.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  border-radius: var(--border-radius);
  transition: var(--hover-transition);
}

.user-info:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.el-dropdown-link {
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 标签页导航 */
.tabs-container {
  background-color: #fff;
  padding: 5px 20px 0;
  box-shadow: var(--box-shadow);
  z-index: 8;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

/* 主内容区 */
.app-main {
  flex: 1;
  padding: 20px;
  background-color: #f0f2f5;
  position: relative;
  overflow-y: auto;
  height: calc(100vh - var(--header-height) - var(--footer-height) - 40px);
}

/* 页脚 */
.app-footer {
  height: var(--footer-height);
  line-height: var(--footer-height);
  background-color: #fff;
  color: #666;
  font-size: 12px;
  border-top: 1px solid #eee;
  text-align: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 通知抽屉内容 */
.notification-container {
  padding: 20px;
}

.empty-notifications {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.empty-notifications i {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.5;
}

/* 主题设置对话框 */
.theme-settings {
  padding: 20px;
}

.theme-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: var(--border-radius);
  background-color: #f5f7fa;
  transition: var(--hover-transition);
}

.theme-item:hover {
  background-color: #eef1f6;
}

/* 动画效果 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* 兼容性样式 */
a {
  text-decoration: none;
  color: inherit;
  transition: var(--hover-transition);
}

a:hover {
  color: var(--theme-color);
}
</style>
