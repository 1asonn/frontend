import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import store from '../store'
import axios from '../axios.js'
import {GetUserAuth} from '../api/index.js'

//解决多次点击重复跳转
const originalPush = VueRouter.prototype.push

VueRouter.prototype.push = function push (location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    children:[
      {
        path: '/index',
        name: 'Index',
        component: () => import('../views/index.vue')
      },
      {
        path: '/userCenter',
        name: 'userCenter',
        component: () => import('../views/userCenter.vue')
      }
    ]
  },
  {
    path: '/Portal',
    name: 'Portal',
    component: () => import('../views/Portal.vue')
  },
  {
    path:'/Login',
    name:'login',
    component: () => import('../views/Login.vue')  
  },
  {
    path:'/about',
    name:'about',
    component: () => import('../views/about.vue')  
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(async(to, from, next) => {
  const token = localStorage.getItem('token')
  const hasRoute = store.state.menu.hasRoutes

  if (to.path === '/login') {
    next()
    return
  }

  if (!token) {
    next('/login')
    return
  }

  // 如果有token但没有路由，重新获取菜单数据
  if (!hasRoute) {
    console.log(hasRoute,'hasRoute')
    try {
      // 从localStorage恢复菜单数据
      const menuList = JSON.parse(localStorage.getItem('menuList') || '[]')
      const signature = localStorage.getItem('menuSignature')
   
      if (menuList && signature) {
        // 如果有本地缓存的菜单数据，尝试验证并使用
        try {
          await store.dispatch('validateAndSetMenu', {
            data: menuList.menu,
            metadata: { signature:signature }
          })
          console.log(menuList,'menuList')
          // 添加路由
          menuList.menu.menu.forEach(menu => {
            if (menu.children) {
              menu.children.forEach(child => {
                let route = Menu2Routes(child)
                if (route) {
                  router.addRoute('Home', route)
                }
              })
            }
          })

          store.commit('changeRouteStatus', true) 
          console.log(hasRoute,'hasRoute')
          next({ ...to, replace: true })
          return
        } catch (error) {
          console.error('本地菜单数据验证失败，尝试重新获取:', error)
        }
      }

      console.log('again')
      
      // 如果没有本地缓存或验证失败，从服务器获取
      const nav = await GetUserAuth()
      console.log(nav.data,'nav.data')
      await store.dispatch('validateAndSetMenu', nav.data)
      
      // 添加路由
      nav.data.data.menu.forEach(menu => {
        if (menu.children) {
          menu.children.forEach(child => {
            let route = Menu2Routes(child)
            if (route) {
              router.addRoute('Home', route)
            }
          })
        }
      })

      store.commit('changeRouteStatus', true)
      next({ ...to, replace: true })
      return
    } catch (error) {
      console.error('获取菜单失败:', error)
      next('/login')
      return
    }
  }

  next()
})

const Menu2Routes = (menu) => {
  if(!menu.component){
    return null
  }

  let route = {
    name: menu.name,
    path: menu.path,
    meta: {
      title: menu.title,
      icon: menu.icon
    },
    component: () => import('@/views/' + menu.component + '.vue')
  }
  
  return route
}

export default router
