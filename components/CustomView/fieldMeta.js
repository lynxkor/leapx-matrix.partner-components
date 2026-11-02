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
    enumCode: item.fieldEnum || null
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

// 工具:取字段对应的可用运算符定义列表
export function getOperatorsForField (fieldKey) {
  const type = getFieldType(fieldKey);
  if (!type) return [];
  return OPERATOR_MATRIX[type].map(opValue => OPERATORS[opValue]);
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
