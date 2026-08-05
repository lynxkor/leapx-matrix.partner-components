import Vue from 'vue';

/**
 * 自定义视图(customView)全局状态 —— AisPageTitle 与业务页之间的桥接。
 *
 * 选中态按 bizKey 分桶缓存(cache)，与业务页 keep-alive 生命周期对齐:
 * 切换路由不清空任何分桶,回到同一 bizKey 页面时自动恢复选中态。
 *
 * 读取分工:
 *   - AisPageTitle(全局唯一、始终激活): 用 activeView getter 读「当前 bizKey 的桶」;
 *   - 业务页 customView mixin(被 keep-alive 缓存): 在 created 时锁定自己的 bizKey,
 *     始终读「自己的桶」cache[bizKey],与全局 bizKey 解耦——
 *     这样切到别的路由时缓存页的 activePresetId 不变,watcher 不会对不可见页触发,
 *     从而避免幽灵请求,无需 _isInactive 守卫。
 */
const customViewModule = {
  namespaced: true,
  state: {
    bizKey: '',
    cache: {}
  },
  getters: {
    // 当前 bizKey 对应的分桶;无则返回空选中态
    activeView (state) {
      return state.cache[state.bizKey] || { activePresetId: null, conditions: null, sortColumns: [] };
    }
  },
  mutations: {
    // 设当前 bizKey(路由切换用),不清任何分桶
    SET_BIZ_KEY (state, bizKey) {
      state.bizKey = bizKey || '';
    },
    // 仅更新当前 bizKey 分桶里的选中字段;首次为该 bizKey 建桶用 Vue.set 保证响应式
    PATCH_VIEW (state, payload) {
      if (!state.cache[state.bizKey]) {
        Vue.set(state.cache, state.bizKey, { activePresetId: null, conditions: null, sortColumns: [] });
      }
      Object.assign(state.cache[state.bizKey], payload);
    },
    // 重置当前 bizKey 分桶的选中态(onReset 用,不影响其他 bizKey)
    RESET_VIEW (state) {
      if (state.cache[state.bizKey]) {
        state.cache[state.bizKey].activePresetId = null;
        state.cache[state.bizKey].conditions = null;
        state.cache[state.bizKey].sortColumns = [];
      }
    }
  }
};

export default customViewModule;
