import Vue from 'vue';
import store from '../../store';
/*
    自定义权限指令，
    支持写法：v-permission = "xxx", v-permission:disabled="xxx"
*/
Vue.directive('permission', {
  inserted (el, binding) {
    const { value, arg, modifiers } = binding;
    const userPermissions = store.state.pageSource?.aisPageSource || [];

    // 检查权限
    const hasPermission = userPermissions.includes(value);
    if (!hasPermission) {
      if (arg === 'disabled') {
        // 禁用模式
        el.disabled = true;
        el.classList.add('is-disabled');
      } else {
        // 默认隐藏模式
        el.parentNode && el.parentNode.removeChild(el);
      }
    }
  }
});
