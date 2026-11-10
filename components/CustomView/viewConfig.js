/**
 * 个人视图的「标准配置」(需求 LP262002 7.1.2.2)。
 *
 * <p>背景:同一个 lib 组件 {@code CustomView} 有两个挂载点 ——
 * ① 全局 {@code AisPageTitle}(列表页,由路由 meta 驱动);
 * ② 业务页内联(如维修出库详情,页面自己拿得到表格列定义)。
 * 之前两个挂载点各写一套 props,导致下拉文案、默认视图能力、编辑弹窗形态
 * 都不一致,看起来像「两个不同组件」。这里把标准配置收敛成唯一出口,
 * 两个挂载点都通过 {@link standardViewOptions} 取 props。</p>
 *
 * <p><b>全局只有一套样式</b>:组件自身的默认 props(触发器文案「系统视图」、
 * 默认视图能力开启)与本文件的 {@link standardViewOptions} 保持一致,
 * 所以无论挂在全局标题栏还是业务页内联,下拉的文案、角标、复制 / 设为默认
 * 都完全一样 —— 不再由路由 meta 的开关决定走哪一套。</p>
 *
 * <p>唯一允许的差异是 <b>页面能力</b>:</p>
 * <ul>
 *   <li>{@code localApply} —— 明细表走前端本地过滤/排序(后端通用查询不可用),
 *       列表页走后端 executeQuery,不能混用;</li>
 *   <li>{@code columns} —— 只有页面级挂载点拿得到表格列定义,传入后才开启
 *       弹窗的「自定义表格」合并模式。全局标题栏拿不到列定义,传空即保持
 *       「条件 + 排序」弹窗,不会出现一个空白的表格设置区。</li>
 *   <li>{@code autoApplyAfterSave} —— 保存视图后是否自动应用该视图(选中它)。
 *       列表页为 true(存完即用上);单据详情页为 false(正在用视图 A 时编辑了
 *       视图 B,保存 B 不该把当前选择抢走)。</li>
 * </ul>
 */

/** 标准触发器文案 —— 与「系统视图」这一行下拉项保持一致 */
export const STANDARD_TRIGGER_TEXT = '系统视图';

/**
 * 由页面表格列定义生成「合并弹窗」所需的 props。
 *
 * <p>与 {@code CustomQueryDialog} 的 showTableSetting / tableConfig /
 * showBaseSettings 契约对应:columnConfig 里每项用 props + label,
 * 兼容 vxe-table 的 {field, title} 和普通 {props, label} 两种列定义。</p>
 *
 * @param {Array<Object>} columns 页面列定义
 * @returns {Object}
 */
export function buildDialogProps (columns) {
  const cols = Array.isArray(columns) ? columns : [];
  return {
    showTableSetting: true,
    tableConfig: {
      autoWrap: false,
      layout: 3,
      isOperateFixed: true,
      columnConfig: cols.map(col => ({
        props: col.field || col.props,
        label: col.title || col.label,
        visible: true,
        disabled: false,
        type: ''
      }))
    },
    // EditTable / LPVxeTable 未开放折行与紧凑度,隐藏基础设置区
    showBaseSettings: false
  };
}

/**
 * 生成传给 {@code CustomView} 的标准 props(可直接 v-bind)。
 *
 * <p>返回的 key 用 kebab-case,保证 Vue 2 模板的 v-bind 对象能正确匹配
 * camelCase 声明的 props。</p>
 *
 * @param {Object}  options
 * @param {Array}   options.columns    页面列定义;有值时开启「自定义表格」合并弹窗
 * @param {Boolean} options.localApply 是否前端本地生效(明细表 true / 列表页 false)
 * @param {Boolean} options.autoApplyAfterSave 保存视图后是否自动应用该视图
 *        (列表页 true / 单据详情页 false)
 * @returns {Object}
 */
export function standardViewOptions ({ columns, localApply = false, autoApplyAfterSave = true } = {}) {
  const props = {
    'trigger-text': STANDARD_TRIGGER_TEXT,
    'enable-default-view': true,
    'local-apply': localApply,
    'auto-apply-after-save': autoApplyAfterSave
  };
  if (Array.isArray(columns) && columns.length) {
    props['dialog-props'] = buildDialogProps(columns);
  }
  return props;
}
