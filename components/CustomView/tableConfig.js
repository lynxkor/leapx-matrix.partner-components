/**
 * 视图的「表格配置」读写与合并规则(自定义表格)。
 *
 * <p>表格配置存在 userDefineTable(按视图 id 关联的 tableCode),
 * 与视图本身(custom_query_view)分表存储:
 * 视图改名/删除不影响表格配置,复制视图时需要另行复制一份。</p>
 *
 * <p>本模块被 lib 的 CustomQueryDialog(合并模式)使用,
 * 供业务页面本地应用表格配置时也复用同一套存储键规则。</p>
 */

/**
 * 表格配置的存储键规则。
 *
 * <p>按「业务键 + 视图 id」组合,保证每个视图一份独立的表格配置,
 * 且不会与 design 包表格设置(按页面 tableCode 存)互相覆盖。
 * 视图弹窗与业务页面都从这里取,避免两处各写一份规则。</p>
 *
 * <p>规则形如 {@code maintenanceOutboundOrderDetail__pvs__<viewId>} ——
 * 与历史实现保持一致,已保存过表格配置的视图不用迁移。</p>
 *
 * @param {String} bizKey 视图业务键
 * @param {String} viewId 视图 id
 * @returns {String} tableCode
 */
export function viewTableConfigCode (bizKey, viewId) {
  return `${bizKey}__pvs__${viewId}`;
}

/**
 * 以页面列定义为基准构造表格配置。
 *
 * @param {Object} config 页面传入的表格配置
 * @returns {Object}
 */
export function buildTableConfig (config) {
  const src = config || {};
  const columnConfig = Array.isArray(src.columnConfig) ? src.columnConfig : [];
  return {
    autoWrap: src.autoWrap,
    layout: src.layout,
    isOperateFixed: src.isOperateFixed,
    columnConfig: columnConfig.map(item => ({ ...item }))
  };
}

/**
 * 把服务端存的表格配置合并到「页面当前列定义」上。
 *
 * <p>合并规则:
 * <ul>
 *   <li>以页面列定义为基准 —— 页面新增的列不该被历史配置里的旧列覆盖掉;</li>
 *   <li>显隐:历史配置里存在的列按其 visible,页面新增的列默认显示;</li>
 *   <li>顺序:历史配置里出现过的列按其顺序排前面,其余保持页面定义顺序。</li>
 * </ul>
 *
 * @param {Object} savedConfig 服务端存的配置
 * @param {Object} baseConfig 页面当前列定义
 * @returns {Object} 合并后的配置
 */
export function mergeTableConfig (savedConfig, baseConfig) {
  const saved = savedConfig || {};
  const base = Array.isArray(baseConfig && baseConfig.columnConfig)
    ? baseConfig.columnConfig
    : [];
  const savedMap = new Map(
    (Array.isArray(saved.columnConfig) ? saved.columnConfig : []).map(item => [item.props, item])
  );
  const merged = base.map(item => {
    const hit = savedMap.get(item.props);
    return { ...item, visible: hit ? hit.visible !== false : true };
  });
  const savedOrder = (Array.isArray(saved.columnConfig) ? saved.columnConfig : [])
    .filter(item => savedMap.has(item.props))
    .map(item => item.props);
  merged.sort((a, b) => {
    const ia = savedOrder.indexOf(a.props);
    const ib = savedOrder.indexOf(b.props);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return {
    autoWrap: saved.autoWrap !== undefined ? saved.autoWrap : baseConfig.autoWrap,
    layout: saved.layout || baseConfig.layout,
    isOperateFixed: saved.isOperateFixed !== undefined ? saved.isOperateFixed : baseConfig.isOperateFixed,
    columnConfig: merged
  };
}

/**
 * 表格配置落库前的字段裁剪。
 *
 * <p>只保留服务端需要的字段,避免把组件内部状态一起写进去。</p>
 *
 * @param {Object} tableConfig 表格配置
 * @returns {Object}
 */
export function toTableConfigPayload (tableConfig) {
  const src = tableConfig || {};
  return {
    autoWrap: src.autoWrap,
    layout: src.layout,
    isOperateFixed: src.isOperateFixed,
    columnConfig: (src.columnConfig || []).map(item => ({
      props: item.props,
      label: item.label,
      visible: item.visible !== false,
      disabled: item.disabled,
      type: item.type
    }))
  };
}
