import Vue from 'vue'
import App from './app'

Vue.config.productionTip = false

Vue.mixin({
  computed: {
    workspace() {
      return {
        lockProportions: false // 启用锁定长宽比
      }
    }
  }
})

new Vue({
  el: '#app',
  render: h => h(App)
})