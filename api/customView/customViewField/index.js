import api from '@/axios';

// 后端 CustomViewFieldController(ControllerMapping = /web/customView/customViewField)
// 上下文路径 /datareport 由 ais 网关转发到 app-ais-datareport 服务
const prefix = 'datareport/web/customView/customViewField/';

/**
 * 根据 bizKey 查询字段列表
 * @param {String} bizKey
 */
export function list (bizKey) {
  return api.jsonPost(prefix + 'list', bizKey);
}

/**
 * 分页查询字段
 * @param {Object} data { bizKey, fieldName, fieldLabel, fieldType, fieldEnum, pageNum, pageSize, ... }
 */
export function page (data) {
  return api.jsonPost(prefix + 'page', data);
}

/**
 * 根据 id 查询字段详情
 * @param {String} id
 */
export function getDetail (id) {
  return api.jsonPost(prefix + 'get', id);
}

/**
 * 新增或更新字段(传 id 为更新,否则为新增)
 * @param {Object} data { id?, bizKey, fieldName, fieldLabel, fieldType, fieldEnum, status? }
 */
export function addOrUpdateField (data) {
  return api.jsonPost(prefix + 'addOrUpdate', data);
}

/**
 * 批量删除字段
 * @param {Array<String>} ids
 */
export function deleteItems (ids) {
  return api.jsonPost(prefix + 'delete', ids);
}

/**
 * 同步视图字段(按 DDL 同步)
 * @param {Object} data { bizKey, databaseName, tableName }
 */
export function syncDdlFields (data) {
  return api.jsonPost(prefix + 'syncDdlFields', data);
}
