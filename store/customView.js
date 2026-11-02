import Vue from 'vue';

/**
 * 自定义视图(customView)全局状态 —— AisPageTitle 与业务页之间的桥接。
 *
 * 选中态按 bizKey 分桶缓存(cache)，与业务页 keep-alive 生命周期对齐:
 * 切换路由不清空任何分桶,回到同一 bizKey 页面时自动恢复选中态。
 *
 * 读写分工(所有操作均显式携带 bizKey,不依赖任何全局当前态,
 * 以规避微前端子应用销毁重建时路由恢复时序造成的写读桶错位):
 *   - AisPageTitle(全局唯一、始终激活): bizKey 取自 $route.meta,
 *     写(PATCH_VIEW/REFRESH_VIEW)与读(conditions/sortColumns/activePresetId)
 *     都指向「当前路由 meta 的桶」;
 *   - 业务页 customView mixin(被 keep-alive 缓存): 在 created 时锁定自己的 bizKey,
 *     始终读写「自己的桶」cache[bizKey] —— 这样切到别的路由时缓存页的
 *     activePresetId 不变,watcher 不会对不可见页触发,
 *     从而避免幽灵请求,无需 _isInactive 守卫。
 */
const EMPTY_VIEW = { activePresetId: null, conditions: null, sortColumns: [], refreshTick: 0 };

function ensureBucket (state, bizKey, refreshTick) {
  if (!state.cache[bizKey]) {
    Vue.set(state.cache, bizKey, { ...EMPTY_VIEW, refreshTick });
  }
  return state.cache[bizKey];
}

const customViewModule = {
  namespaced: true,
  state: {
    cache: {}
  },
  mutations: {
    // 更新指定 bizKey 分桶里的选中字段;bizKey 为空时忽略,避免写入脏桶
    PATCH_VIEW (state, payload) {
      const { bizKey, ...rest } = payload || {};
      if (!bizKey) return;
      Object.assign(ensureBucket(state, bizKey, 0), rest);
    },
    // 重置指定 bizKey 分桶的选中态(onReset 用,不影响其他 bizKey)
    RESET_VIEW (state, bizKey) {
      if (!bizKey || !state.cache[bizKey]) return;
      state.cache[bizKey].activePresetId = null;
      state.cache[bizKey].conditions = null;
      state.cache[bizKey].sortColumns = [];
    },
    // 自增指定 bizKey 分桶的 refreshTick:重复选择同一视图时,
    // activePresetId 值不变无法触发 mixin watch,改由 refreshTick 驱动刷新
    REFRESH_VIEW (state, bizKey) {
      if (!bizKey) return;
      ensureBucket(state, bizKey, 1).refreshTick += 1;
    }
  }
};

export default customViewModule;
