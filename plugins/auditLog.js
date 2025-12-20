// 全局注册审核日志插件
import AuditLogComponent from '../components/AuditLog/index.vue';

const AuditLogPlugin = {
  install (Vue, options = {}) {
    // 创建Vue实例作为全局调用接口
    const AuditLogConstructor = Vue.extend(AuditLogComponent);
    let instance = null;

    const initInstance = () => {
      instance = new AuditLogConstructor({
        el: document.createElement('div')
      });
      document.body.appendChild(instance.$el);
    };

    // 全局方法
    Vue.prototype.$auditLog = {
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
    Vue.$auditLog = Vue.prototype.$auditLog;
  }
};

export default AuditLogPlugin;
