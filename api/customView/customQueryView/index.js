import api from '@/axios';

// 后端 CustomQueryViewController(ControllerMapping = /web/customView/customQueryView)
// 上下文路径 /datareport 由 ais 网关转发到 app-ais-datareport 服务
const prefix = 'datareport/web/customView/customQueryView/';

/**
 * 分页查询视图
 * @param {Object} data { bizKey, viewName, isTop, perfStatus, pageNum, pageSize }
 */
export function page (data) {
  return api.jsonPost(prefix + 'page', data);
}

/**
 * 查询视图详情(包含 conditionTree 与 sort)
 * @param {String} id
 */
export function getDetail (id) {
  return api.jsonPost(prefix + 'get', id);
}

/**
 * 新增或更新视图(bizKey, viewName, conditionTree(JSON.stringify), sortField, sortOrder)
 * @param {Object} data 含可选 id,id 存在则更新,否则新增
 */
export function addOrUpdate (data) {
  return api.jsonPost(prefix + 'addOrUpdate', data);
}

/**
 * 批量删除视图
 * @param {Array<String>} ids
 */
export function deleteItems (ids) {
  return api.jsonPost(prefix + 'delete', ids);
}

/**
 * 置顶指定视图(同一 bizKey 下唯一置顶)
 * @param {String} id
 */
export function pin (id) {
  return api.jsonPost(prefix + 'pin', id);
}

/**
 * 性能测试,返回 { perfStatus, perfDurationMs, perfTestedTime }
 * @param {String} id
 */
export function perf (id) {
  return api.jsonPost(prefix + 'perf', id);
}

/**
 * 按视图统一执行查询(后端根据 viewId 解析 bizKey 与查询条件)
 * @param {Object} data { viewId, pageNum, pageSize }
 */
export function executeQuery (data) {
  return api.jsonPost(prefix + 'executeQuery', data);
}
