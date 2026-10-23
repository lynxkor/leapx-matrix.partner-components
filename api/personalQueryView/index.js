import api from '../../axios';

// 后端 PersonalQueryViewController(ControllerMapping = /web/common/personalQueryView)
// 上下文路径 /datacenter 由 ais 网关转发到 app-ais-datacenter 服务
const prefix = 'datacenter/web/common/personalQueryView/';

/**
 * 查询当前登录用户的个人查询视图列表(扁平数组,首项为虚拟默认视图)
 * @param {String} tableCode 页面编码
 */
export function list (tableCode) {
  return api.jsonPost(prefix + 'list', { tableCode });
}

/**
 * 新增或修改查询视图
 * @param {Object} data { id?, tableCode, viewName, updateType(1新增/2修改), queryCondition }
 */
export function addOrUpdate (data) {
  return api.jsonPost(prefix + 'addOrUpdate', data);
}

/**
 * 删除查询视图(单条)
 * @param {String} id
 */
export function remove (id) {
  return api.jsonPost(prefix + 'delete', { id });
}

/**
 * 置顶查询视图
 * @param {String} id
 */
export function moveToTop (id) {
  return api.jsonPost(prefix + 'top', { id });
}
