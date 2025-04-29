import Vue from 'vue'
import Vuex from 'vuex'
import menu from '../store/modules/menu.js'
import chat from '../store/modules/chat.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    token:''
  },

  getters: {
  },

  mutations: {
    SET_TOKEN(state,token){
      state.token = token
      localStorage.setItem('token',token)
    },
    resetState(state){
      state.token = ''
      // 保存用户凭据（如果存在）
      const userCredentials = localStorage.getItem('userCredentials')
      
      // 清除token
      localStorage.removeItem('token')
      
      // 如果之前有保存的用户凭据，则恢复它
      if (userCredentials) {
        localStorage.setItem('userCredentials', userCredentials)
      }
    }
  },
  actions: {
  },
  modules: {
    menu,
    chat
  }
})
