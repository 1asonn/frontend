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
      state.menuList = data
    },
    setMenuPublicKey(state, publicKey) {
      state.publicKey = publicKey;
      localStorage.setItem('menuPublicKey', publicKey);
    },

    setPermitList(state, { authoritys, signature }) {
      if (!validateSignature(authoritys, signature)) {
        console.error('权限数据签名验证失败');
        router.push('/login');
        return;
      }

      const encryptedAuth = encrypt(authoritys);
      localStorage.setItem('authBackup', encryptedAuth);
      
      state.authoritys = authoritys;
      state.permList = authoritys;
    },

    changeRouteStatus(state, hasRoutes) {
      state.hasRoutes = hasRoutes;
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
      localStorage.removeItem('menuBackup');
      localStorage.removeItem('menuSignature');
      localStorage.removeItem('authBackup');
    }
  },

  getters: {
    getMenuList: (state) => {
      return state.menuList
      // try {
      //   const encryptedBackup = localStorage.getItem('menuBackup');
      //   const storedSignature = localStorage.getItem('menuSignature');
        
      //   if (!encryptedBackup || !storedSignature) {
      //     return state.menuList;
      //   }

      //   const decryptedBackup = decrypt(encryptedBackup);
        
      //   if (JSON.stringify(state.menuList) !== JSON.stringify(decryptedBackup)) {
      //     console.error('检测到菜单数据被篡改');
      //     router.push('/login');
      //     return [];
      //   }

      //   if (!validateSignature(state.menuList, storedSignature)) {
      //     console.error('菜单签名验证失败');
      //     router.push('/login');
      //     return [];
      //   }

      //   return state.menuList;
      // } catch (error) {
      //   console.error('菜单数据验证失败:', error);
      //   router.push('/login');
      //   return [];
      // }
    },

    getAuthoritys: (state) => {
      try {
        const encryptedAuth = localStorage.getItem('authBackup');
        if (!encryptedAuth) return state.authoritys;

        const decryptedAuth = decrypt(encryptedAuth);
        
        if (JSON.stringify(state.authoritys) !== JSON.stringify(decryptedAuth)) {
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
      try {
        // 验证菜单签名
        const isValid = await verifySignature(data)
        if (!isValid) {
          console.error('菜单数据签名验证失败')
          return Promise.reject('签名验证失败')
        }
  
        // 验证成功，设置菜单
        commit('setMenuList', data.data.menu)
        return Promise.resolve(data.data.menu)
      } catch (error) {
        console.error('菜单验证失败:', error)
        return Promise.reject(error)
      }
    }
  }
}