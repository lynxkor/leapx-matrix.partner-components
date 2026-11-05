/**
 * 个人视图 —— 批量排序字段(sortJson)的解析 / 序列化工具。
 *
 * <p><b>存储格式</b>(后端 custom_query_view.sort_json 列):
 * <pre>{@code [{"index":1,"sortField":"spare_part_code","sortOrder":"asc"}]}</pre>
 * —— {@code index} 为排序位次(1 起,越小越靠前),{@code sortField} 为字段名
 * (下划线形态,与后端 custom_view_field.field_name 一致),
 * {@code sortOrder} 为方向 asc / desc。</p>
 *
 * <p><b>历史数据兼容</b>:本视图表原先只有 {@code sort_field} / {@code sort_order}
 * 两个字段(单字段排序)。{@link resolveSortList} 在 {@code sortJson} 为空时
 * 回落到这两个旧字段,按「第一个排序项」处理,行为与改造前完全一致。</p>
 *
 * <p>本模块被共享组件(CustomView / CustomQueryDialog)与业务项目内的
 * 「个人视图设置」弹窗共用,避免两处各写一份解析规则导致读不一致。</p>
 */

/**
 * 虚拟字段黑名单 —— 【序号】是前端虚拟列(表格里按行号生成),
 * 没有对应的业务字段,不能参与排序(PRD 明确要求剔除)。
 *
 * <p>这里同时按字段名和字段中文名兜底:后端字段元数据里正常不会出现这些字段,
 * 但一旦有人配了同名字段,也不该让它进排序候选。</p>
 */
const VIRTUAL_FIELD_KEYS = [
  'index', 'idx', 'seq', 'no', 'num', 'number',
  'serialnumber', 'serial_number',
  'rowindex', 'row_index',
  'rownum', 'row_num',
  'rownumber', 'row_number',
  'xuhao', 'xu_hao'
];

const VIRTUAL_FIELD_LABELS = ['序号', '行号', '序号 '];

/**
 * 判断字段是否为不可参与排序的虚拟字段(如【序号】)。
 *
 * @param {Object} field 字段定义 {key, label, type}
 * @returns {Boolean}
 */
export function isVirtualSortField (field) {
  if (!field) return false;
  const key = String(field.key || '').toLowerCase();
  if (key && VIRTUAL_FIELD_KEYS.indexOf(key) !== -1) return true;
  const label = String(field.label || '').trim();
  if (label && VIRTUAL_FIELD_LABELS.indexOf(label) !== -1) return true;
  return false;
}

/**
 * 解析 sortJson 为排序项列表(按 index 升序,index 重排为 1..n)。
 *
 * <p>容错规则:
 * <ul>
 *   <li>非法 JSON / 非数组 → 返回空列表(不让一条脏数据打挂整个视图下拉);</li>
 *   <li>字段名为空的元素丢弃(前端可能先建空行再选字段);</li>
 *   <li>index 缺省时按数组下标兜底(1 起);</li>
 *   <li>排序方向为空按升序处理(PRD:新增排序字段默认升序),非法值也按升序兜底。</li>
 * </ul>
 *
 * @param {String} sortJson JSON 数组字符串,允许为 null / 空
 * @returns {Array<Object>} [{index, sortField, sortOrder}]
 */
export function parseSortJson (sortJson) {
  if (!sortJson || typeof sortJson !== 'string') return [];
  let array;
  try {
    array = JSON.parse(sortJson);
  } catch (e) {
    return [];
  }
  if (!Array.isArray(array)) return [];

  const list = [];
  array.forEach((node, i) => {
    if (!node || typeof node !== 'object') return;
    const field = typeof node.sortField === 'string' ? node.sortField.trim() : '';
    if (!field) return;
    const rawOrder = typeof node.sortOrder === 'string' ? node.sortOrder.trim().toLowerCase() : '';
    const parsedIndex = parseInt(node.index, 10);
    list.push({
      index: isNaN(parsedIndex) ? i + 1 : parsedIndex,
      sortField: field,
      sortOrder: rawOrder === 'desc' ? 'desc' : 'asc'
    });
  });
  list.sort((a, b) => a.index - b.index);
  list.forEach((item, i) => { item.index = i + 1; });
  return list;
}

/**
 * 取出视图实际生效的排序项列表(兼容历史数据)。
 *
 * <p><b>口径与后端 {@code SortJsonSupport.resolve} 严格一致</b>:
 * <ul>
 *   <li>{@code sortJson} 非空 → 以它为准。<b>哪怕解析出来是空数组</b>
 *       (即库里的 {@code "[]"},表示用户明确清空了排序),也不回落到旧字段 ——
 *       否则「清空排序」会被旧字段顶回来,用户清不掉。</li>
 *   <li>{@code sortJson} 为空 / 空白 → 历史数据,用旧的 {@code sortField} /
 *       {@code sortOrder} 拼出单字段排序项。</li>
 *   <li>{@code sortJson} 内容损坏(非法 JSON / 非数组)→ 同样回落到旧字段,
 *       与后端「脏数据回落旧字段」的行为一致。</li>
 * </ul></p>
 *
 * @param {Object} detail 视图详情(含 sortJson / sortField / sortOrder)
 * @returns {Array<Object>} [{field, order}] order 为 asc / desc
 */
export function resolveSortList (detail) {
  if (!detail) return [];
  const raw = typeof detail.sortJson === 'string' ? detail.sortJson.trim() : '';
  if (raw) {
    let parsedArray = null;
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value)) parsedArray = value;
    } catch (e) {
      // 非法 JSON → parsedArray 保持 null,下面回落旧字段
    }
    // 合法 JSON 数组 → 以它为准(含空数组:用户明确清空过排序)
    if (parsedArray) {
      return parseSortJson(raw).map(item => ({ field: item.sortField, order: item.sortOrder }));
    }
    // 非法 JSON / 非数组 → 回落旧字段(与后端一致)
  }
  if (detail.sortField) {
    const rawOrder = String(detail.sortOrder || '').trim().toLowerCase();
    return [{
      field: String(detail.sortField).trim(),
      order: rawOrder === 'desc' ? 'desc' : 'asc'
    }];
  }
  return [];
}

/**
 * 排序项列表 → sortJson(JSON 数组字符串)。
 *
 * <p>空列表返回 {@code "[]"} 而不是空串 —— 空串会被后端当成「没传 sortJson」
 * 而回落到旧字段,导致「清空排序」不生效。后端 {@code SortJsonSupport.resolve}
 * 对 {@code "[]"} 的处理是「以它为准」(解析出空列表,不回落旧字段),
 * 与这里的行为一致。</p>
 *
 * @param {Array<Object>} list [{field, order}]
 * @returns {String}
 */
export function toSortJson (list) {
  const array = (Array.isArray(list) ? list : [])
    .filter(item => item && item.field)
    .map((item, i) => ({
      index: i + 1,
      sortField: String(item.field).trim(),
      sortOrder: item.order === 'desc' ? 'desc' : 'asc'
    }));
  return JSON.stringify(array);
}

/**
 * 排序项列表 → 视图下拉 / 业务页面用的 sortColumns。
 *
 * <p>输出结构与改造前完全一致({column, sort}),只是可能有多项:
 * 次序靠前的字段先排。</p>
 *
 * @param {Array<Object>} list [{field, order}]
 * @returns {Array<Object>} [{column, sort}] sort 为 ASC / DESC
 */
export function toSortColumns (list) {
  return (Array.isArray(list) ? list : [])
    .filter(item => item && item.field)
    .map(item => ({
      column: item.field,
      sort: (item.order === 'desc' ? 'desc' : 'asc').toUpperCase()
    }));
}
