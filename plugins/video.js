
import AisVideo from '../components/AisVideo/index.vue';

const AisVideoPlugin = {
  install (Vue, options = {}) {
    // 创建Vue实例作为全局调用接口
    const AisVideoConstructor = Vue.extend(AisVideo);
    let instance = null;

    const initInstance = () => {
      instance = new AisVideoConstructor({
        el: document.createElement('div')
      });
      document.body.appendChild(instance.$el);
    };

    // 全局方法
    Vue.prototype.$video = {
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
    Vue.$video = Vue.prototype.$video;
  }
};

export default AisVideoPlugin;
