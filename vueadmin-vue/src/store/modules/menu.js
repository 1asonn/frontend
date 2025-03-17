import Vue from 'vue'
import Vuex from 'vuex'
import { verifySignature } from '../../utils/menuSecurity'
import router from '../../router'

Vue.use(Vuex)

export default {
  state: {
    publicKey: '',
    permList: [],
    menuList: [],
    authoritys: [],
    hasRoutes: false,
    menuSignature: '', 
    editableTabsValue: 'Index',
    editableTabs: [{
      title: '首页',
      name: 'Index'
    }],
  },

  mutations: {
    setMenuList(state, data) {
      state.menuList = data.data.menu.menu
      // 持久化菜单数据
      localStorage.setItem('menuList', JSON.stringify(data.data))
      localStorage.setItem('menuSignature', data.metadata.signature)
    },

    setMenuPublicKey(state, publicKey) {
      state.publicKey = publicKey;
      localStorage.setItem('menuPublicKey', publicKey);
    },

    setPermitList(state, { authoritys, signature }) {
      state.authoritys = authoritys;
      state.permList = authoritys;
      localStorage.setItem('authBackup', JSON.stringify(authoritys));
    },

    changeRouteStatus(state, hasRoutes) {
      state.hasRoutes = hasRoutes;
      localStorage.setItem('hasRoutes', hasRoutes.toString())
    },

    addTab(state, tab) {
      let index = state.editableTabs.findIndex(e => e.name === tab.name);

      if (index === -1) {
        state.editableTabs.push({
          title: tab.title,
          name: tab.name
        });
      }
      state.editableTabsValue = tab.name;
    },

    resetState(state) {
      state.permList = [];
      state.menuList = [];
      state.authoritys = [];
      state.hasRoutes = false;
      state.menuSignature = '';
      state.editableTabsValue = 'Index';
      state.editableTabs = [{
        title: '首页',
        name: 'Index'
      }];
      localStorage.removeItem('menuList');
      localStorage.removeItem('menuSignature');
      localStorage.removeItem('authBackup');
      localStorage.removeItem('hasRoutes');
    }
  },

  getters: {
    getMenuList: (state) => {
      return state.menuList
    },

    getAuthoritys: (state) => {
      try {
        const authoritys = JSON.parse(localStorage.getItem('authBackup') || '[]');
        if (authoritys.length === 0) return state.authoritys;
        
        if (JSON.stringify(state.authoritys) !== JSON.stringify(authoritys)) {
          console.error('检测到权限数据被篡改');
          router.push('/login');
          return [];
        }

        return state.authoritys;
      } catch (error) {
        console.error('权限数据验证失败:', error);
        router.push('/login');
        return [];
      }
    }
  },

  actions: {
    async validateAndSetMenu({ commit }, data) {
      console.log(data,'important')
      try {
        // 验证菜单签名
        const isValid = await verifySignature(data)
        console.log(isValid,'isValid!!!!!!!!')
        if (!isValid) {
          console.error('菜单数据签名验证失败')
          return Promise.reject('签名验证失败')
        }
  
        // 验证成功，设置菜单
        commit('setMenuList', {
          data: {
            menu: data.data
          },
          metadata: {
            signature: data.metadata?.signature || data.signature
          }
        })
        return Promise.resolve(data.data.menu || data.data)
      } catch (error) {
        console.error('菜单验证失败:', error)
        return Promise.reject(error)
      }
    }
  }
}