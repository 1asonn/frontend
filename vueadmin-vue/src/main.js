import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Element from 'element-ui'
import "element-ui/lib/theme-chalk/index.css"
import axios from './axios.js'
import global from './globalFun.js'
import i18n from './i18n/index.js'
import FullCalendar from '@fullcalendar/vue';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
require("./mock.js")


Vue.prototype.$axios = axios 
Vue.use(Element)
Vue.config.productionTip = false
Vue.component('FullCalendar', FullCalendar);

new Vue({
  router,
  store,
  i18n,
  data:{
    calendarPlugins: [dayGridPlugin, interactionPlugin]
  },
  render: h => h(App)
}).$mount('#app')
