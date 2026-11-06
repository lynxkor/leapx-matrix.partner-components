/**
 * 自定义查询 — 字段元数据 / 运算符定义
 *
 * 字段列表不再硬编码,改由调用方(通常为 index.vue)通过 {@link setFields} 注入
 * 后端 /web/customView/customViewField/list 的返回值。注入后所有工具函数都按
 * 当前生效的字段列表工作。
 *
 * 运算符与类型×运算符矩阵仍在前端静态维护,因为它是控件渲染规则,跟字段无关。
 */

import * as customViewFieldApi from '@/libs/api/customView/customViewField';

/**
 * 关联对象 JSON 的解析与「关联字段唯一运算符」放在本模块，
 * **不放在 relationMeta.js**。
 *
 * 原因：relationMeta.js 会 import 公共接口(@/libs/api/common)，
 * 那条依赖链一旦出问题(接口模块加载异常/循环依赖)，
 * 连带把运算符下拉也一起打挂 —— el-select 的候选项由 el-option 的
 * created() 注册，父组件渲染一抛异常就没有候选项，界面只显示「无数据」，
 * 而用户看到的现象是「无法选择运算符」，极难定位。
 *
 * 运算符下拉是纯逻辑，不该依赖任何网络/接口模块，故解析口径收敛到本文件；
 * relationMeta.js 再从这里转出同名导出，外部引用方无需改动。
 */

/** 关联字段唯一允许的运算符 */
export const RELATION_OPERATOR = 'contains';

/**
 * 解析关联对象 JSON
 * @param {String} value 如 '{"table":"dealer","column":"province"}'
 * @returns {Object|null} { table, column }；非 JSON 格式或字段缺失返回 null
 */
export function parseRelationJson (value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw || raw.charAt(0) !== '{') return null;
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (err) {
    return null;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const table = typeof obj.table === 'string' ? obj.table.trim() : '';
  const column = typeof obj.column === 'string' ? obj.column.trim() : '';
  if (!table || !column) return null;
  return { table, column };
}

/**
 * 字段的「唯一定位键」——field_name + field_relation。
 *
 * <p><b>为什么不能只用 field_name</b>:同一个字段可以声明多个关联对象,
 * 例如门店编码字段 dealer_code 可以同时配「省 / 市 / 区 / 大区 / 经营状态(服务)」
 * 五个关联对象 —— 它们在库里是 5 条记录,field_name 完全相同,只有 field_relation 不同。
 * 若下拉的 option value 只用 field_name,5 个 option 的 value 相同,
 * el-select 匹配选中态时会全部高亮(用户看到的「选中一个,其他几个也亮了」)。</p>
 *
 * <p><b>键的格式</b>:<code>fieldName|fieldRelation</code>。
 * field_relation 为空(普通字段)时退化成只有 field_name。</p>
 *
 * @param {String} fieldName 字段名
 * @param {String} fieldRelation 关联对象 JSON 字符串
 * @returns {String}
 */
export function fieldUniqueKey (fieldName, fieldRelation) {
  if (!fieldName) return '';
  const relation = (fieldRelation || '').trim();
  return relation ? `${fieldName}|${relation}` : fieldName;
}

/**
 * 从唯一定位键里还原出字段名。
 *
 * @param {String} key 唯一定位键
 * @returns {String}
 */
export function fieldNameFromKey (key) {
  if (!key) return '';
  const idx = String(key).indexOf('|');
  return idx === -1 ? String(key) : String(key).slice(0, idx);
}

/**
 * 从唯一定位键里还原出关联对象 JSON。
 *
 * @param {String} key 唯一定位键
 * @returns {String} 关联对象 JSON;无关联对象返回空串
 */
export function fieldRelationFromKey (key) {
  if (!key) return '';
  const idx = String(key).indexOf('|');
  return idx === -1 ? '' : String(key).slice(idx + 1);
}

// 当前生效的字段定义(key/label/type/enumCode,可选 options)
//   初始为空,调用 setFields([]) 后再渲染界面;否则所有字段下拉为空。
let fields = [];

/**
 * 把后端返回的 CustomViewFieldResp 列表转成控件消费结构,并设为当前生效字段。
 * 后端字段:fieldName / fieldLabel / fieldType / fieldEnum / status。
 *
 * @param {Array<Object>} list 后端 list 接口返回数组
 * @returns {Array<Object>} 注入后的字段数组(供外部直接渲染使用)
 */
export function setFields (list) {
  fields = (Array.isArray(list) ? list : []).map(item => ({
    key: item.fieldName,
    label: item.fieldLabel,
    type: item.fieldType,
    enumCode: item.fieldEnum || null,
    // 关联对象声明（JSON 字符串，如 {"table":"dealer","column":"province"}）；
    // 声明了关联对象的字段，运算符与值控件都跟普通字段不一样。
    fieldRelation: item.fieldRelation || null,
    // 唯一定位键（field_name + field_relation）：
    // 同一个字段名可配多个关联对象（省/市/区/大区/经营状态），
    // 下拉的选中态按它区分，否则选一个会全部高亮。
    uniqueKey: fieldUniqueKey(item.fieldName, item.fieldRelation)
  }));
  return fields;
}

/**
 * 拉取并注入字段元数据(基于 /web/customView/customViewField/list 接口)。
 * @param {String} bizKey
 * @returns {Promise<Array<Object>>}
 */
export async function loadFields (bizKey) {
  const list = await customViewFieldApi.list(bizKey);
  return setFields(list);
}

/** 取当前生效字段列表(只读快照) */
export function getFields () {
  return fields.slice();
}

// 运算符定义(valueKind 决定值控件: single | multi | daterange | empty)
export const OPERATORS = {
  equals: { value: 'equals', label: '等于', valueKind: 'multi' },
  notEquals: { value: 'notEquals', label: '不等于', valueKind: 'multi' },
  contains: { value: 'contains', label: '包含', valueKind: 'multi' },
  notContains: { value: 'notContains', label: '不包含', valueKind: 'multi' },
  isEmpty: { value: 'isEmpty', label: '为空', valueKind: 'empty' },
  isNotEmpty: { value: 'isNotEmpty', label: '不为空', valueKind: 'empty' },
  startsWith: { value: 'startsWith', label: '以...开头', valueKind: 'multi' },
  endsWith: { value: 'endsWith', label: '以...结尾', valueKind: 'multi' },
  gt: { value: 'gt', label: '大于', valueKind: 'single' },
  lt: { value: 'lt', label: '小于', valueKind: 'single' },
  ge: { value: 'ge', label: '大于等于', valueKind: 'single' },
  le: { value: 'le', label: '小于等于', valueKind: 'single' },
  between: { value: 'between', label: '介于', valueKind: 'daterange' },
  inList: { value: 'inList', label: '在...中', valueKind: 'multi' },
  notInList: { value: 'notInList', label: '不在...中', valueKind: 'multi' },
  // 日期专用(valueKind 'date' 渲染单日选择框)
  dateEquals: { value: 'dateEquals', label: '等于', valueKind: 'date' },
  dateBefore: { value: 'dateBefore', label: '早于（包含当天）', valueKind: 'date' },
  dateAfter: { value: 'dateAfter', label: '晚于（包含当天）', valueKind: 'date' },
  // 早于今天(不包含今天) —— 需求 LP262042 7.1.2.2。
  // 无需填值:边界由后端按查询当天零点实时计算,故 valueKind 为 empty。
  // 注意与上面的 dateBefore 区分:那个含当天且需指定日期,这个不含当天且不需日期。
  dateBeforeToday: { value: 'dateBeforeToday', label: '早于今天（不包含今天）', valueKind: 'empty' },
  // 日期相对区间(无需值,后端按当前日期计算区间;周一为一周第一天)
  yesterday: { value: 'yesterday', label: '昨天', valueKind: 'empty' },
  today: { value: 'today', label: '今天', valueKind: 'empty' },
  tomorrow: { value: 'tomorrow', label: '明天', valueKind: 'empty' },
  lastWeek: { value: 'lastWeek', label: '上周', valueKind: 'empty' },
  thisWeek: { value: 'thisWeek', label: '本周', valueKind: 'empty' },
  nextWeek: { value: 'nextWeek', label: '下周', valueKind: 'empty' },
  lastMonth: { value: 'lastMonth', label: '上月', valueKind: 'empty' },
  thisMonth: { value: 'thisMonth', label: '本月', valueKind: 'empty' },
  nextMonth: { value: 'nextMonth', label: '下月', valueKind: 'empty' },
  lastQuarter: { value: 'lastQuarter', label: '上季度', valueKind: 'empty' },
  thisQuarter: { value: 'thisQuarter', label: '本季度', valueKind: 'empty' },
  nextQuarter: { value: 'nextQuarter', label: '下季度', valueKind: 'empty' },
  lastYear: { value: 'lastYear', label: '去年', valueKind: 'empty' },
  thisYear: { value: 'thisYear', label: '今年', valueKind: 'empty' },
  nextYear: { value: 'nextYear', label: '明年', valueKind: 'empty' }
};

// 运算符 × 字段类型 矩阵(允许的运算符 value 列表)
const OPERATOR_MATRIX = {
  text: ['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty', 'startsWith', 'endsWith'],
  number: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'gt', 'lt', 'ge', 'le'],
  date: [
    'isEmpty', 'isNotEmpty',
    'dateEquals', 'dateBefore', 'dateAfter', 'between', 'dateBeforeToday',
    'yesterday', 'today', 'tomorrow',
    'lastWeek', 'thisWeek', 'nextWeek',
    'lastMonth', 'thisMonth', 'nextMonth',
    'lastQuarter', 'thisQuarter', 'nextQuarter',
    'lastYear', 'thisYear', 'nextYear'
  ],
  enum: ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'inList', 'notInList']
};

// 工具:取字段类型
export function getFieldType (fieldKey) {
  const f = fields.find(item => item.key === fieldKey);
  return f ? f.type : null;
}

// 工具:取字段定义
export function getField (fieldKey) {
  return fields.find(item => item.key === fieldKey) || null;
}

/**
 * 工具:按唯一定位键取字段定义。
 *
 * <p>同一个 field_name 可配多个关联对象(省/市/区/大区/经营状态),
 * 要区分它们必须带上关联对象 —— 见 {@link fieldUniqueKey}。</p>
 *
 * @param {String} uniqueKey 唯一定位键
 * @returns {Object|null}
 */
export function getFieldByUniqueKey (uniqueKey) {
  if (!uniqueKey) return null;
  return fields.find(item => item.uniqueKey === uniqueKey) || null;
}

// 工具:按字段类型取可用运算符定义列表
export function getOperatorsByType (type) {
  const allowed = OPERATOR_MATRIX[type];
  if (!allowed) return [];
  return allowed.map(opValue => OPERATORS[opValue]).filter(Boolean);
}

// 工具:取字段对应的可用运算符定义列表
// 注意:这里按「模块内当前生效的字段列表」查,字段列表缺失时返回空数组;
// 渲染层请优先用 getOperatorsForFieldDef(字段对象),避免全局状态与
// 实际渲染的字段列表不一致(下拉会是空的,用户完全无从下手)。
export function getOperatorsForField (fieldKey) {
  const field = getField(fieldKey);
  return field ? getOperatorsForFieldDef(field) : [];
}

// 工具:按字段对象取可用运算符定义列表
//   关联字段 -> 只给「包含」
//   普通字段 -> 按类型×运算符矩阵
//   字段缺失/类型未知 -> 空数组(不抛异常,避免整个条件行渲染失败)
export function getOperatorsForFieldDef (field) {
  if (!field) return [];
  // 关联字段:只允许「包含」
  // 条件是作用在关联表上的（查关联对象的数据 → 结果集 → 主表 IN），
  // 「包含」既覆盖精确匹配也能表达模糊筛选，其余运算符在关联对象场景下
  // 要么语义重复、要么退化成查全量，不对用户开放。
  if (parseRelationJson(field.fieldRelation)) {
    return [OPERATORS[RELATION_OPERATOR]].filter(Boolean);
  }
  return getOperatorsByType(field.type);
}

// 工具:取字段声明的关联对象 { table, column }；没声明返回 null
export function getFieldRelation (fieldKey) {
  const f = getField(fieldKey);
  if (!f || !f.fieldRelation) return null;
  return parseRelationJson(f.fieldRelation);
}

// 工具:取运算符定义
export function getOperator (operatorValue) {
  return OPERATORS[operatorValue] || null;
}

// 工具:运算符是否需要值
export function operatorNeedsValue (operatorValue) {
  const op = getOperator(operatorValue);
  return op && op.valueKind !== 'empty';
}

// 工具:创建空行
export function createEmptyRow () {
  return {
    id: `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    field: null,
    operator: null,
    value: null
  };
}

// 工具:创建空分组
export function createEmptyGroup (logic = 'AND') {
  return {
    id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'group',
    logic,
    conditions: [createEmptyRow()]
  };
}

// 工具:深度克隆条件树
export function cloneTree (tree) {
  return JSON.parse(JSON.stringify(tree));
}
