import Vue from 'vue';

/**
 * 通用查询视图(后端「个人查询视图」)的跨组件状态。
 *
 * 为什么不注册成 Vuex module:src/libs 是多个前端共用的 submodule,
 * 新增 Vuex module 需要每个宿主应用都在 src/store/index.js 注册,
 * 否则 commit('personalQueryView/...') 会直接抛错。
 * 这里用模块级 Vue.observable 单例,两个消费组件直接 import,宿主零侵入。
 * ponytail: 模块级 observable,若后续需要 Vuex DevTools/跨应用调试再迁到 store module。
 *
 * 与 CustomView 的桶模型一致:所有状态按 tableCode 分桶,
 * 不依赖任何"当前页面"全局态,keep-alive 缓存页之间互不干扰。
 */
const EMPTY_BUCKET = () => ({
  registered: 0, // 当前登记了列表搜索栏的实例数,> 0 时标题栏显示视图入口
  selectedId: null, // null = 默认查询视图
  selectedName: '',
  apply: null, // { id, name, queryCondition }
  applyTick: 0 // 每次显式选择视图自增,驱动列表页应用条件
});

export const DEFAULT_VIEW_NAME = '默认查询视图';

export const state = Vue.observable({ cache: {} });

/**
 * 页面编码:标题栏与搜索栏必须使用同一套规则。
 * 可通过路由 meta.personalQueryViewTableCode 覆盖,否则用 route.name 兜底 path。
 * @param {Object} route
 * @returns {String}
 */
export function resolveTableCode (route) {
  if (!route) return '';
  const meta = route.meta || {};
  return String(meta.personalQueryViewTableCode || route.name || route.path || '');
}

export function getBucket (tableCode) {
  if (!tableCode) return null;
  return state.cache[tableCode] || null;
}

function ensureBucket (tableCode) {
  if (!tableCode) return null;
  if (!state.cache[tableCode]) {
    Vue.set(state.cache, tableCode, EMPTY_BUCKET());
  }
  return state.cache[tableCode];
}

export function register (tableCode) {
  const bucket = ensureBucket(tableCode);
  if (bucket) bucket.registered += 1;
}

/**
 * @returns {Number|null} 剩余登记数;未登记过返回 null
 */
export function unregister (tableCode) {
  if (!tableCode || !state.cache[tableCode]) return null;
  const bucket = state.cache[tableCode];
  if (bucket.registered > 0) bucket.registered -= 1;
  return bucket.registered;
}

/** 保存后同步选中名称,不触发页面刷新 */
export function select (tableCode, id, name) {
  const bucket = ensureBucket(tableCode);
  if (!bucket) return;
  bucket.selectedId = id === null || id === undefined ? null : id;
  bucket.selectedName = name || '';
}

/**
 * 选中并应用视图。queryCondition 为 null 表示默认查询视图,
 * 列表页收到后走自身 reset 流程。
 */
export function apply (tableCode, payload) {
  const bucket = ensureBucket(tableCode);
  if (!bucket) return;
  const data = payload || {};
  const id = data.id === null || data.id === undefined ? null : data.id;
  bucket.selectedId = id;
  bucket.selectedName = data.name || '';
  bucket.apply = {
    id,
    name: data.name || '',
    queryCondition: data.queryCondition || {}
  };
  bucket.applyTick += 1;
}

export function clearSelection (tableCode) {
  const bucket = getBucket(tableCode);
  if (!bucket) return;
  bucket.selectedId = null;
  bucket.selectedName = '';
}

/**
 * 解析后端返回的查询条件。
 * 空值视为空条件;非法 JSON 返回 null,由调用方提示且不改变当前选中态。
 * @param {Object} row
 * @returns {Object|null}
 */
export function parseCondition (row) {
  const raw = row
    ? (row.queryConditionJson !== null && row.queryConditionJson !== undefined
      ? row.queryConditionJson
      : row.queryCondition)
    : null;
  if (raw === null || raw === undefined || raw === '') return {};
  // 对象形态未来可能出现在出参里,深拷贝一份,避免页面编辑表单时反向污染视图列表缓存
  if (typeof raw === 'object') return JSON.parse(JSON.stringify(raw));
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return null;
  }
}
