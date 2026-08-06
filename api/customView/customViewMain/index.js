import api from '@/axios';

// 后端 CustomViewMainController(ControllerMapping = /web/customView/customViewMain)
// 上下文路径 /datareport 由 ais 网关转发到 app-ais-datareport 服务
const prefix = 'datareport/web/customView/customViewMain/';

/**
 * 分页查询视图主表
 * @param {Object} data { bizKey, path, pageNum, pageSize, ... }
 */
export function page (data) {
  return api.jsonPost(prefix + 'page', data);
}

/**
 * 根据 id 查询视图主表详情
 * @param {String} id
 */
export function getDetail (id) {
  return api.jsonPost(prefix + 'get', id);
}

/**
 * 新增或更新视图主表(传 id 为更新,否则为新增)
 * @param {Object} data { id?, bizKey, path, status? }
 */
export function addOrUpdate (data) {
  return api.jsonPost(prefix + 'addOrUpdate', data);
}

/**
 * 批量删除视图主表
 * @param {Array<String>} ids
 */
export function deleteItems (ids) {
  return api.jsonPost(prefix + 'delete', ids);
}