import api from '../../../axios';

// 后端 CustomQueryViewController(ControllerMapping = /web/customView/customQueryView)
// 上下文路径 /datareport 由 ais 网关转发到 app-ais-datareport 服务
const prefix = 'datareport/web/customView/customQueryView/';

/**
 * 分页查询视图
 * @param {Object} data { bizKey, viewName, perfStatus, pageNum, pageSize }
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
 * 视图排序(需求 LP262042 7.1.2.2,整表覆盖)
 * 置顶 = 把目标视图挪到数组首位后调本接口,不再有独立的置顶接口。
 * @param {Array<String>} viewIds 按目标顺序排列的视图 id 列表,第 N 个即序号 N
 */
export function reorder (viewIds) {
  return api.jsonPost(prefix + 'reorder', { viewIds });
}

/**
 * 性能测试,返回 { perfStatus, perfDurationMs, perfTestedTime }
 * @param {String} id
 */
export function perf (id) {
  return api.jsonPost(prefix + 'perf', id);
}

/**
 * 设置默认视图 / 取消默认(需求 LP262002 7.1.2.2)
 * @param {Object} data { id, defaultIs }
 *   id 必填;defaultIs 不传按「设为默认」处理,传 false 表示取消默认
 */
export function setDefault (data) {
  return api.jsonPost(prefix + 'setDefault', data);
}

/**
 * 复制视图(需求 LP262002 7.1.2.2)
 *
 * <p>复制逻辑在后端:前端只传被复制视图的 id,条件树 / 排序 / 视图名都由后端生成
 * (视图名重名时后端会继续往后拼「-复制」),复制出的视图归属当前登录用户。</p>
 *
 * @param {Object} data { id, viewName, bizKey }
 *   id:被复制的视图 id;复制「系统视图」时为空
 *   viewName:复制「系统视图」时用的基础名称(系统视图文案),复制用户视图时不用传
 *   bizKey:复制「系统视图」时的业务场景 key,复制用户视图时不用传
 * @returns {Promise<Object>} { id, viewName } 新视图的 id 与名称
 */
export function copy (data) {
  return api.jsonPost(prefix + 'copy', data);
}

/**
 * 按视图统一执行查询(后端根据 viewId 解析 bizKey 与查询条件)
 * @param {Object} data { viewId, pageNum, pageSize }
 */
export function executeQuery (data) {
  return api.jsonPost(prefix + 'executeQuery', data);
}
