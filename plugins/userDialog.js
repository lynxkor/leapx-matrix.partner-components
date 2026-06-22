// 全局注册用户信息弹框插件
import UserDialogComponent from '../components/UserDialog/index.vue';

const UserDialogPlugin = {
  install (Vue, options = {}) {
    const UserDialogConstructor = Vue.extend(UserDialogComponent);
    let instance = null;

    const initInstance = () => {
      instance = new UserDialogConstructor({
        el: document.createElement('div')
      });
      document.body.appendChild(instance.$el);
    };

    Vue.prototype.$userDialog = {
      show (options = {}) {
        if (!instance) {
          initInstance();
        }
        Vue.nextTick(() => {
          instance.show(options);
        });
        return instance;
      }
    };

    Vue.$userDialog = Vue.prototype.$userDialog;
  }
};

export default UserDialogPlugin;
