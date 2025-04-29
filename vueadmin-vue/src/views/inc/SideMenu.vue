<template>
  <div>
    <!-- 菜单导航 -->
    <el-menu
      :collapse-transition="false"
      :default-active="this.$store.state.menu.editableTabsValue"
      :collapse="isCollapse"
      class="tech-menu"
      background-color="#1a2942"
      text-color="#e0e0e0"
      active-text-color="#ffffff"
      unique-opened>
      
      <!-- 首页菜单项 -->
      <router-link class="router-link" to="/index">
        <el-menu-item index="Index" @click="selectMenu({name:'Index',title:'首页'})">
          <i class="el-icon-s-home menu-icon"></i>
          <span slot="title">首页</span>
        </el-menu-item>
      </router-link>

      <!-- 其他菜单项 -->
      <el-submenu 
        :index="menu.name" 
        v-for="(menu, index) in menuList" 
        :key="'menu-'+index">
        <template slot="title">
          <i :class="menu.icon + ' menu-icon'"></i>
          <span>{{menu.title}}</span>
        </template>

        <router-link 
          class="router-link" 
          :to="item.path" 
          v-for="(item, idx) in menu.children" 
          :key="'item-'+index+'-'+idx">
          <el-menu-item :index="item.name" @click="selectMenu(item)">
            <i :class="item.icon + ' menu-icon'"></i>
            <span slot="title">{{ item.title }}</span>
          </el-menu-item>
        </router-link>
      </el-submenu>
    </el-menu>
    
    <!-- 底部系统信息 -->
    <div class="system-info" v-if="!isCollapse">
      <div class="system-version">
        <i class="el-icon-monitor"></i> v1.2.0
      </div>
      <div class="system-time">{{ currentTime }}</div>
    </div>
  </div>
</template>

<script>
import { getCurrentUser } from '@/utils/auth'

export default {
    name: 'SideMenu',
    props: {
        isCollapse: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            userAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
            username: '管理员',
            userRole: '系统管理员',
            currentTime: new Date().toLocaleTimeString(),
            timer: null,
            hoverIndex: null,
            activeMenus: []
        }
    },
    computed: {
        menuList: {
            get() {
                return this.$store.state.menu.menuList
            }
        }
    },
    methods: {
        // 选择菜单项
        selectMenu(item) {
            this.$store.commit('addTab', item)
            // 添加激活效果
            this.activeMenus.push(item.name)
            setTimeout(() => {
                this.activeMenus = this.activeMenus.filter(name => name !== item.name)
            }, 1000)
        },
        
        // 获取用户信息
        getUserInfo() {
            const user = getCurrentUser()
            if (user) {
                this.username = user.realname || user.username || '管理员'
                this.userRole = user.role || '系统管理员'
                if (user.avatar) {
                    this.userAvatar = user.avatar
                }
            }
        },
        
        // 更新当前时间
        updateTime() {
            this.currentTime = new Date().toLocaleTimeString()
        },
        
        // 设置悬停菜单项
        setHoverIndex(index) {
            this.hoverIndex = index
        },
        
        // 清除悬停菜单项
        clearHoverIndex() {
            this.hoverIndex = null
        }
    },
    created() {
        // 获取用户信息
        this.getUserInfo()
        
        // 启动时间定时器
        this.timer = setInterval(() => {
            this.updateTime()
        }, 1000)
    },
    beforeDestroy() {
        // 清除定时器
        if (this.timer) {
            clearInterval(this.timer)
        }
    }
}
</script>


<style scoped>
/* 菜单样式 */
.tech-menu {
  height: 100%;
  border-right: none !important;
}

/* 菜单图标 */
.menu-icon {
  color: #00c6ff !important;
  margin-right: 5px;
  transition: all 0.3s ease;
}

/* 激活菜单项 */
.el-menu-item.is-active {
  background: linear-gradient(90deg, rgba(0, 198, 255, 0.15), transparent) !important;
  border-left: 3px solid #00c6ff;
}

.el-menu-item.is-active .menu-icon {
  color: #ffffff !important;
  text-shadow: 0 0 5px rgba(0, 198, 255, 0.7);
}

/* 菜单项悬停效果 */
.el-menu-item:hover, 
.el-submenu__title:hover {
  background: rgba(0, 198, 255, 0.1) !important;
}

.el-menu-item:hover .menu-icon,
.el-submenu__title:hover .menu-icon {
  transform: scale(1.2);
}

/* 子菜单样式 */
.el-menu--inline .el-menu-item {
  padding-left: 40px !important;
}

/* 底部系统信息 */
.system-info {
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.system-version {
  display: flex;
  align-items: center;
  gap: 5px;
}

.system-time {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  color: #00c6ff;
}

/* 兼容性样式 */
.router-link {
  text-decoration: none;
  display: block;
}

/* 科技感扫描线效果 */
.el-menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00c6ff, transparent);
  animation: scanline 4s linear infinite;
  opacity: 0.5;
  z-index: 1;
}

@keyframes scanline {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>