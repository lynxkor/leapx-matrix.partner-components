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
/**
 * 视图允许使用的页签白名单(需求 LP262042 7.1.2.2)。
 *
 * 保修申请页共七个股接,只有前三个查询 warranty_apply 主表,与视图的
 * condition_tree 字段配置一致;后四个(备件/工时/其他/审批记录)查的是明细数据,
 * 把主表字段的视图条件拼上去会出现不存在的列名。
 * 这里集中声明,AisPageTitle 与业务页共用同一份,避免两处各写一套。
 */
export const CUSTOM_VIEW_TABS = ['all', 'manager', 'gm'];

/** 该页签是否允许使用个人查询视图 */
export function isCustomViewTab (tab) {
  if (!tab) return false;
  return CUSTOM_VIEW_TABS.includes(tab);
}

const EMPTY_VIEW = { activePresetId: null, conditions: null, sortColumns: [], refreshTick: 0, currentTab: '' };

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
    },
    // 业务页在 activeTab 变化时回写当前页签。
    // AisPageTitle 挂在全局 layout 里、业务页之上,拿不到业务页内部的页签状态,
    // 由业务页主动写入,canCustomView 才能判断当前页签是否允许用视图。
    SET_CURRENT_TAB (state, { bizKey, tab }) {
      if (!bizKey) return;
      ensureBucket(state, bizKey, 0).currentTab = tab || '';
    }
  }
};

export default customViewModule;
