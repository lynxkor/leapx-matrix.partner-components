/**
 * 自定义条件构建器 —— 「关联对象」元信息与维度候选值
 *
 * 背景：视图字段在 custom_view_field.field_relation 里声明了关联对象后，
 * 用户填的值不是字段自身的值，而是「另一个业务对象的某个维度」的取值。
 * 例如「门店编码」关联 {"table":"dealer","column":"province"} 后，
 * 用户选的是「江苏省」这一维度取值，字段里存的却是门店编码。
 *
 * 落库格式 = JSON 字符串 {"table":"dealer","column":"province"}
 *   table  = 一级字典取值（业务表，如 dealer）
 *   column = 二级字典取值（该表下的维度，如 province）
 *   存字典取值而不是显示名：显示名只是文案，字典一改历史数据就对不上；
 *   而下游要的是能直接拼 SQL 的表名与列名。
 *
 * 运算符口径：关联字段只允许「包含」。
 *   条件是作用在关联表上的（查关联对象的数据 → 结果集 → 主表 IN），
 *   「包含」既覆盖了精确匹配，也能表达「江」这类模糊筛选；
 *   其余运算符（等于/不等于/为空…）在关联对象场景下要么语义重复、
 *   要么会退化成查全量，不对用户开放。
 *
 * 维度候选值的取值口径 —— 存编码、展示名称：
 *   province / city / district  行政区划编码（/area/tree，与门店主数据同源）
 *   region                      大区组织编码（/accountService/orgInfo，orgType=1020）
 *   serviceStatusName           经营状态(服务)字典编码（/network/portal/DataDict）
 *   存编码而不是名称：区县重名（如多个「鼓楼区」）用名称会串，
 *   编码唯一且后端匹配的就是编码。
 */

import { getProvinceTree, getRegion, getDataDict } from '@/libs/api/common';
import { parseRelationJson, RELATION_OPERATOR } from './fieldMeta';

/**
 * 关联对象 JSON 的解析口径与「关联字段唯一运算符」由 fieldMeta.js 持有
 * （纯逻辑，不依赖接口模块），这里只做转出，保持既有引用方不变。
 */
export { parseRelationJson, RELATION_OPERATOR };

/** 关联对象维度 → 候选值加载器 */
const COLUMN_LOADERS = {
  province: loadAreaOptions,
  city: loadAreaOptions,
  district: loadAreaOptions,
  region: loadRegionOptions,
  serviceStatusName: loadServiceStatusOptions
};

/**
 * 该字段是否声明了关联对象
 * @param {String} fieldRelation 字段的关联对象 JSON
 * @returns {Boolean}
 */
export function isRelationField (fieldRelation) {
  return !!parseRelationJson(fieldRelation);
}

/**
 * 载入某维度的候选值
 * @param {String} column province / city / district / region / serviceStatusName
 * @returns {Promise<Array<{code: String, name: String}>>}
 */
export async function loadRelationDimensionOptions (column) {
  const loader = COLUMN_LOADERS[column];
  if (!loader) return [];
  try {
    return await loader(column);
  } catch (e) {
    return [];
  }
}

/**
 * 省 / 市 / 区候选值（行政区划树）
 *
 * 树的形状：{ name, code, child: [...] }，三级分别是省 / 市 / 区。
 * 展示名用全路径（省/市/区），避免同名区县在列表里分不清。
 *
 * @param {String} column province / city / district
 * @returns {Promise<Array<{code: String, name: String}>>}
 */
async function loadAreaOptions (column) {
  const level = column === 'province' ? 1 : (column === 'city' ? 2 : 3);
  const res = await getProvinceTree();
  const tree = Array.isArray(res) ? res : ((res && res.data) || []);
  const options = [];
  const walk = (nodes, path) => {
    (nodes || []).forEach(node => {
      if (!node) return;
      const current = path.concat(node.name);
      if (current.length === level) {
        if (node.code) {
          options.push({ code: String(node.code), name: current.join('/') });
        }
        return;
      }
      walk(node.child, current);
    });
  };
  walk(tree, []);
  return options;
}

/**
 * 大区候选值（组织机构，orgType=1020 即门店大区）
 * @returns {Promise<Array<{code: String, name: String}>>}
 */
async function loadRegionOptions () {
  const res = await getRegion({});
  const list = Array.isArray(res) ? res : ((res && (res.data || res.records)) || []);
  return list
    .map(item => ({
      code: String((item && (item.orgCode || item.code)) || ''),
      name: (item && (item.orgName || item.name)) || ''
    }))
    .filter(item => item.code);
}

/**
 * 经营状态(服务)候选值
 * @returns {Promise<Array<{code: String, name: String}>>}
 */
async function loadServiceStatusOptions () {
  const res = await getDataDict({ storeStatus: 1 });
  const list = (res && res.storeStatus) || [];
  return list
    .map(item => ({
      code: String((item && item.code) || ''),
      name: (item && (item.message || item.name)) || ''
    }))
    .filter(item => item.code);
}
