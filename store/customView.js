/**
 * 自定义视图(customView)全局状态 —— AisPageTitle 与业务页之间的桥接。
 *
 * AisPageTitle 中的 <CustomView> 把选中态写入此处；
 * 业务页 customView mixin 读取 activePresetId 驱动 getData/onViewChange。
 * 不持久化：视图锁定态随路由切换应重置，避免跨页串状态。
 */
const customViewModule = {
  namespaced: true,
  state: {
    bizKey: '',
    activePresetId: null,
    conditions: null,
    sortColumns: []
  },
  mutations: {
    SET_CUSTOM_VIEW_STATE (state, payload) {
      Object.assign(state, payload);
    },
    RESET_CUSTOM_VIEW (state) {
      state.activePresetId = null;
      state.conditions = null;
      state.sortColumns = [];
    }
  }
};

export default customViewModule;
