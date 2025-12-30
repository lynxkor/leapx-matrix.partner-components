// 全局注册审核日志插件
import PrintComponent from '../components/Print/index.vue';

const PrintPlugin = {
  install (Vue, options = {}) {
    // 创建Vue实例作为全局调用接口
    const PrintConstructor = Vue.extend(PrintComponent);
    let instance = null;

    const initInstance = () => {
      instance = new PrintConstructor({
        el: document.createElement('div')
      });
      document.body.appendChild(instance.$el);
    };

    // 全局方法
    Vue.prototype.$print = {
      show (options = {}) {
        if (!instance) {
          initInstance();
        }

        // 延迟显示以确保DOM已准备就绪
        Vue.nextTick(() => {
          instance.show(options);
        });

        return instance;
      }
    };

    // 静态方法
    Vue.$print = Vue.prototype.$print;
  }
};

export default PrintPlugin;
