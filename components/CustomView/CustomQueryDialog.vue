<template>
  <el-dialog
    title="自定义条件查询"
    :visible.sync="dialogVisible"
    class="m-custom-query-dialog"
    width="80%"
    :close-on-click-modal="false"
    @close="onClose"
    @closed="onClosed"
  >
    <div class="c-cqd">
      <!-- 视图名称(必填) -->
      <div class="c-cqd__presets">
        <span class="c-cqd__presets-label">
          视图名称
          <span class="c-cqd__presets-required">*</span>
        </span>
        <el-input
          v-model="viewName"
          placeholder="请输入"
          size="small"
          maxlength="20"
          show-word-limit
          class="c-cqd__presets-input"
        />
        <el-button
          v-if="!showTableSetting"
          size="small"
          icon="el-icon-cpu"
          :disabled="!currentPresetId || applying"
          :loading="perfTesting"
          @click="onRunPerfTest"
        >性能测试</el-button>
      </div>

      <el-divider></el-divider>
      <!-- 错误汇总 -->
      <el-alert
        v-if="errorSummary.length > 0"
        :title="errorSummary.join('；')"
        type="error"
        :closable="false"
        class="c-cqd__alert"
      />

      <!-- 递归条件树 -->
      <div v-loading="fieldsLoading" class="c-cqd__tree">
        <custom-condition-group
          v-if="!fieldsLoading"
          :group="workingTree"
          :fields="fields"
          :depth="0"
          :removable="false"
          @change="onTreeChange"
        />
        <div v-else class="c-cqd__tree-placeholder">字段元数据加载中...</div>
        <!--
          一个条件都没配时的说明:条件查询支持「一个字段都不选」,
          这种视图保存后不做条件过滤(只按下方排序展示),先说清楚避免误解。
        -->
        <div v-if="!fieldsLoading && !hasAnyCondition" class="c-cqd__tree-tip">
          未选择任何条件字段:保存后该视图不做条件过滤(仅按下方排序展示)。
        </div>
      </div>

      <el-divider></el-divider>
      <!--
        排序(批量多字段,需求 LP262002 7.1.2.2 自定义排序)。
        交互按 PRD:「＋添加排序字段」下拉 + 每行(手柄/字段名/升降序/删除),
        行与行的先后即排序优先级,靠前的字段先排(可拖动手柄调整次序)。
      -->
      <div class="c-cqd__sort">
        <div class="c-cqd__sort-content">
          <div class="c-cqd__sort-title">排序</div>
          <sort-field-editor
            v-model="sortList"
            :fields="fields"
          />
        </div>
      </div>

      <!--
        自定义表格(合并模式)。
        业务页面(如单据明细表的个人视图)需要把「表格设置」与「条件 + 排序」
        放在同一个弹窗里,开启 showTableSetting 即可 —— 不必在业务项目内
        再复制一份弹窗组件。
      -->
      <template v-if="showTableSetting">
        <el-divider></el-divider>
        <div class="c-cqd__table">
          <div class="c-cqd__table-title">自定义表格</div>
          <!--
            必须绑 tableConfigState(按视图 id 加载/合并后的当前配置),
            不能绑 tableConfig(页面列定义基准)。

            原因:el-dialog 的内容首次打开后不会销毁,TableSetting 只 mount 一次,
            它靠 value 的深监听来重置内部 form。若绑的是 tableConfig(基准),
            该 prop 由父页面的 computed 缓存、引用恒定,深监听永不触发 ——
            上一个视图里勾掉的列会一直残留到下一个视图,
            表现为「改了视图 A,打开视图 B 时 B 的表格也跟着变了」,
            甚至把 A 的残留状态存进 B 的表格配置。

            绑 tableConfigState 后:每次打开弹窗(visible 监听)与每次
            loadTableConfig 都会重新赋值一个新对象 -> 深监听触发 -> 内部 form
            按当前视图重建,视图之间互不串。
          -->
          <table-setting
            ref="tableSetting"
            :value="tableConfigState"
            :show-base-settings="showBaseSettings"
          />
        </div>
      </template>
    </div>

    <template v-slot:footer>
      <div class="dialog-footer">
        <el-button size="small" :disabled="applying" @click="onClear">清空</el-button>
        <el-button size="small" :disabled="applying" @click="onClose">取消</el-button>
        <el-button size="small" type="primary" :loading="applying || perfTesting" @click="onApply">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import CustomConditionGroup from './CustomConditionGroup.vue';
import SortFieldEditor from './SortFieldEditor.vue';
import TableSetting from './TableSetting.vue';
import {
  loadFields,
  getFields,
  createEmptyRow,
  cloneTree,
  operatorNeedsValue,
  pruneEmptyRows,
  hasConfiguredCondition as treeHasCondition
} from './fieldMeta';
import { resolveSortList, toSortJson } from './sortJson';
import {
  viewTableConfigCode,
  buildTableConfig,
  mergeTableConfig,
  toTableConfigPayload
} from './tableConfig';
import { getTableConfig, tableAddOrUpdate } from '@/libs/api/common';
import * as customQueryViewApi from '@/libs/api/customView/customQueryView';

export default {
  name: 'CustomQueryDialog',
  components: { CustomConditionGroup, SortFieldEditor, TableSetting },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    value: {
      type: Object,
      default: null
    },
    sort: {
      type: Object,
      default: null
    },
    activePresetId: {
      type: String,
      default: null
    },
    bizKey: {
      type: String,
      required: true
    },
    /**
     * 性能测试用的业务上下文标识。
     *
     * <p>视图对应的列表接口若必须带业务上下文才能定位数据(如单据明细表视图,
     * 通用视图查询接口拿不到单据 ID),由宿主传入此参数,性能测试会一并带给后端,
     * 后端再透传给被测接口。</p>
     *
     * <p>为空 = 沿用历史行为(只传视图 id)。</p>
     */
    perfTabCode: {
      type: String,
      default: ''
    },
    /**
     * 是否在弹窗里显示「自定义表格」区块(合并模式)。
     *
     * <p>业务页面(如单据明细表的个人视图)需要把「表格设置」与「条件 + 排序」
     * 放在同一个弹窗里,开启本开关即可 —— 业务项目内不必再复制一份弹窗组件。</p>
     *
     * <p>默认 false = 保持原行为(纯条件查询弹窗),不影响既有页面。</p>
     */
    showTableSetting: {
      type: Boolean,
      default: false
    },
    /**
     * 「自定义表格」区的列定义基准(页面当前的列配置)。
     *
     * <p>仅 showTableSetting 开启时生效。表格配置以它为基准:
     * 页面新增的列不会被历史配置覆盖,列的显隐与顺序按视图保存的值回填。</p>
     */
    tableConfig: {
      type: Object,
      default: () => ({
        autoWrap: false,
        layout: 3,
        columnConfig: [],
        isOperateFixed: true
      })
    },
    /**
     * 是否显示「表格设置」里的基础设置区块(折行 / 紧凑度 / 操作列固定)。
     *
     * <p>底层表格组件若不支持这三项(如 EditTable 写死了 show-overflow 与行高),
     * 传 false 隐藏该区块,避免出现「设了不生效」。</p>
     */
    showBaseSettings: {
      type: Boolean,
      default: true
    },
    /**
     * 表格配置的存储键前缀。默认按「业务键 + 视图 id」生成,
     * 需要与业务页本地读取表格配置时保持一致时才覆盖。
     */
    tableConfigCodePrefix: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      dialogVisible: this.visible,
      workingTree: this.makeInitialTree(),
      /**
       * 排序项列表 [{field, order}] —— 排序的唯一数据源。
       *
       * <p>需求 LP262002 7.1.2.2:排序由单字段改为批量多字段。
       * 数组顺序即排序优先级(靠前的字段先排),可拖动手柄调整次序。</p>
       *
       * <p>历史兼容:读取时优先取 sortJson(多字段),没有才回落到旧的
       * sortField / sortOrder 单字段,回填到本列表里 —— 见 {@link resolveSortList}。</p>
       */
      sortList: this.makeInitialSortList(),
      errorSummary: [],
      viewName: '',
      currentPresetId: null,
      perfTesting: false,
      applying: false,
      fieldsMeta: getFields(),
      fieldsLoading: false,
      // 「自定义表格」区的当前配置(合并模式)
      tableConfigState: buildTableConfig(this.tableConfig)
    };
  },
  computed: {
    fields () {
      return this.fieldsMeta;
    },
    /**
     * 当前条件树里是否还有「已配置」的条件行(选了字段的行)。
     *
     * <p>一个都没配 → 允许保存,保存后该视图不做条件过滤。</p>
     */
    hasAnyCondition () {
      return treeHasCondition(this.workingTree);
    }
  },
  watch: {
    visible (val) {
      this.dialogVisible = val;
      if (val) {
        // 兜底:每次打开都从干净的搜索态开始(即便上次隐藏时 closed 未触发)
        this.resetTableSettingFilter();
        this.workingTree = this.makeInitialTree();
        this.sortList = this.makeInitialSortList();
        this.errorSummary = [];
        this.viewName = '';
        this.currentPresetId = this.activePresetId || null;
        // 合并模式:表格配置以页面列定义为基准,再叠加该视图已保存的显隐与顺序
        this.tableConfigState = buildTableConfig(this.tableConfig);
        this.fetchFields();
        if (this.currentPresetId) {
          this.loadPresetDetail(this.currentPresetId);
          this.loadTableConfig(this.currentPresetId);
        }
      }
    },
    activePresetId (val) {
      this.currentPresetId = val || null;
    }
  },
  methods: {
    async fetchFields () {
      this.fieldsLoading = true;
      try {
        this.fieldsMeta = await loadFields(this.bizKey);
      } catch (e) {
        this.fieldsMeta = [];
        this.$message.error('字段元数据加载失败');
      } finally {
        this.fieldsLoading = false;
      }
    },
    makeInitialTree () {
      if (this.value && this.value.conditions && this.value.conditions.length > 0) {
        return cloneTree(this.value);
      }
      return this.makeEmptyTree();
    },
    /**
     * 空白条件树:一行未配置的条件(弹窗打开 / 清空后的默认形态)。
     *
     * <p>与「保存时一个字段都没选」的空条件树({@link pruneEmptyRows} 的结果)
     * 区分开:这里是界面上可见的一行空条件,存库前会被剔除。</p>
     */
    makeEmptyTree () {
      return {
        logic: 'AND',
        conditions: [createEmptyRow()]
      };
    },
    /**
     * 初始排序项列表。
     *
     * <p>宿主可通过 sort 入参传一个单字段排序 {field, order}(历史接口),
     * 这里把它转成排序项列表形态,让批量与单字段共用同一套数据结构。</p>
     *
     * @returns {Array<Object>} [{field, order}]
     */
    makeInitialSortList () {
      if (this.sort && this.sort.field) {
        return [{ field: this.sort.field, order: this.sort.order || 'asc' }];
      }
      return [];
    },
    onTreeChange (newTree) {
      this.workingTree = newTree;
    },

    async loadPresetDetail (id) {
      try {
        const data = await customQueryViewApi.getDetail(id);
        if (!data) return;
        this.viewName = data.viewName || '';
        const tree = data.conditionTree ? JSON.parse(data.conditionTree) : null;
        // 空条件树(该视图一个字段都没选过)回填成「一行空白条件」,
        // 与新建视图的形态一致 —— 否则打开编辑时条件区是空的,用户不知道能加条件。
        this.workingTree = tree && tree.conditions && tree.conditions.length > 0
          ? cloneTree(tree)
          : this.makeEmptyTree();
        // 排序:优先 sortJson(多字段),历史数据回落到旧的 sortField / sortOrder。
        this.sortList = resolveSortList(data);
      } catch (e) {
        this.$message.error('加载视图详情失败');
      }
    },

    /**
     * 表格配置在服务端的存储键。
     *
     * @param {String} viewId 视图 id
     * @returns {String}
     */
    tableConfigCode (viewId) {
      return this.tableConfigCodePrefix
        ? `${this.tableConfigCodePrefix}:${viewId}`
        : viewTableConfigCode(this.bizKey, viewId);
    },

    /**
     * 加载已保存视图的表格配置并回填到「自定义表格」区(合并模式)。
     *
     * <p>读不到 / 没有历史配置时保持页面列定义为基准,不影响弹窗使用。</p>
     *
     * @param {String} viewId 视图 id
     */
    async loadTableConfig (viewId) {
      if (!this.showTableSetting || !viewId) return;
      this.tableConfigState = buildTableConfig(this.tableConfig);
      try {
        const res = await getTableConfig(this.tableConfigCode(viewId));
        const cfg = res && res.config;
        if (!cfg || !Array.isArray(cfg.columnConfig) || cfg.columnConfig.length === 0) return;
        this.tableConfigState = mergeTableConfig(cfg, this.tableConfig);
      } catch (e) {
        // 表格配置是增强能力,读取失败不阻断弹窗使用
      }
    },

    /**
     * 保存当前表格配置到服务端(按视图 id 关联)。
     *
     * @param {String} viewId 视图 id
     * @param {Object} tableConfig 表格配置
     */
    async saveTableConfig (viewId, tableConfig) {
      if (!this.showTableSetting || !viewId || !tableConfig) return;
      try {
        await tableAddOrUpdate({
          tableCode: this.tableConfigCode(viewId),
          config: toTableConfigPayload(tableConfig),
          resizableData: {}
        });
      } catch (e) {
        this.$message.error('保存表格配置失败');
      }
    },

    /**
     * 取当前「自定义表格」区的配置。
     *
     * @returns {Object}
     */
    getTableConfig () {
      const ts = this.$refs.tableSetting;
      return ts ? ts.getTableConfig() : this.tableConfigState;
    },

    async buildAndSave (id, name) {
      const payload = {
        id: id || null,
        bizKey: this.bizKey,
        viewName: name,
        // 条件树:存库前剔掉「没选字段」的条件行(未配置的行)。
        // 一个字段都没选时存空条件树,后端渲染出的 WHERE 为空 —— 即不做条件过滤。
        conditionTree: JSON.stringify(pruneEmptyRows(this.workingTree)),
        // 批量排序(需求 LP262002 7.1.2.2):只发新字段 sortJson,不双写旧的
        // sortField / sortOrder —— 两套字段不并存,读取侧优先用 sortJson,
        // 历史数据(没有 sortJson)才回落到旧的单字段。
        // 空列表序列化成 "[]" 而不是空串:空串会被后端当成「没传 sortJson」
        // 而回落到旧字段,导致「清空排序」不生效。
        sortJson: toSortJson(this.sortList)
      };
      try {
        const res = await customQueryViewApi.addOrUpdate(payload);
        return res || id || '';
      } catch (e) {
        return '';
      }
    },

    async onApply () {
      if (this.applying || this.perfTesting) return;
      const name = (this.viewName || '').trim();
      const treeResult = this.validateTree(this.workingTree);
      const sortResult = this.validateSort();
      const summary = [];
      if (!name) summary.push('请输入视图名称');
      summary.push(...treeResult.summary, ...sortResult.summary);
      if (summary.length > 0) {
        this.errorSummary = summary;
        return;
      }
      this.errorSummary = [];
      this.applying = true;
      try {
        const newId = await this.buildAndSave(this.currentPresetId, name);
        if (!newId) {
          this.$message.error('保存视图失败');
          return;
        }
        this.currentPresetId = newId;

        // 合并模式:表格配置按视图 id 单独存(与视图分表)
        if (this.showTableSetting) {
          await this.saveTableConfig(newId, this.getTableConfig());
        }

        // 合并模式(本地生效场景):不做性能测试,保存即生效。
        // 明细表这类视图后端通用查询拿不到单据 id,性能测试必然失败,
        // 走的是业务页面本地求值,没有「接口性能」可测。
        if (this.showTableSetting) {
          this.$message.success('保存成功');
          this.$emit('save', this.buildSavePayload(newId, name));
          this.$emit('update:visible', false);
          this.$emit('update:active-preset-id', newId);
          return;
        }

        this.$message.success('保存成功,正在测试接口...');
        const passed = await this.onRunPerfTest();
        // 测试未通过:弹窗保持打开便于修改条件,不触发页面刷新
        if (!passed) return;
        this.$emit('update:visible', false);
        this.$emit('update:active-preset-id', this.currentPresetId);
      } finally {
        this.applying = false;
      }
    },

    /**
     * 组装保存成功后的 save 事件载荷。
     *
     * <p>合并模式下宿主页面需要它来应用视图(条件 / 排序 / 表格配置)。</p>
     *
     * @param {String} id 视图 id
     * @param {String} name 视图名
     * @returns {Object}
     */
    buildSavePayload (id, name) {
      return {
        id,
        viewName: name,
        // 与落库口径一致:剔掉未配置(没选字段)的条件行
        conditionTree: pruneEmptyRows(this.workingTree),
        sortFields: (this.sortList || []).map(item => ({
          column: item.field,
          sort: item.order ? item.order.toUpperCase() : ''
        })),
        tableConfig: this.showTableSetting ? this.getTableConfig() : null
      };
    },

    /**
     * 执行性能测试并返回是否通过
     * @returns {Boolean}
     */
    async onRunPerfTest () {
      if (!this.currentPresetId || this.perfTesting) return false;
      const result = this.validateTree(this.workingTree);
      if (!result.valid) {
        this.errorSummary = result.summary;
        this.$message.warning('请先完善条件再测试');
        return false;
      }
      this.errorSummary = [];
      this.perfTesting = true;
      try {
        // 带业务上下文时传对象 { id, tabCode },否则沿用历史形态(裸 id 字符串)
        const payload = this.perfTabCode
          ? { id: this.currentPresetId, tabCode: this.perfTabCode }
          : this.currentPresetId;
        const data = await customQueryViewApi.perf(payload);
        const status = data && data.perfStatus;
        const dur = data && data.perfDurationMs;
        this.$message[status === 'passed' ? 'success' : 'error'](
          `性能测试${status === 'passed' ? '通过' : '未通过'}:耗时 ${dur}ms`
        );
        return status === 'passed';
      } catch (e) {
        this.$message.error('性能测试失败');
        return false;
      } finally {
        this.perfTesting = false;
      }
    },

    onClear () {
      this.$confirm('确认清空当前条件?', '提示', {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.workingTree = this.makeEmptyTree();
        // 排序一并清空(批量排序项列表)
        this.sortList = [];
        // 合并模式:表格配置一并回到页面列定义的基准
        if (this.showTableSetting) {
          this.tableConfigState = buildTableConfig(this.tableConfig);
        }
        this.errorSummary = [];
      }).catch(() => {});
    },
    onClose () {
      this.$emit('update:visible', false);
    },
    /**
     * 弹窗隐藏(关闭动画结束)后,清空「自定义表格」区里输入的列搜索关键字。
     *
     * <p>覆盖全部隐藏路径:取消 / 右上角 X / ESC / 保存成功,它们最终都会让
     * el-dialog 的 visible 变 false 并触发 closed。放在动画结束后而不是
     * 关闭瞬间,避免弹窗还在淡出时看到列表因过滤解除而闪一下。</p>
     */
    onClosed () {
      this.resetTableSettingFilter();
    },
    /**
     * 复位「自定义表格」区的列搜索框(合并模式才有该组件)。
     */
    resetTableSettingFilter () {
      const ts = this.$refs.tableSetting;
      if (ts && typeof ts.resetFilter === 'function') ts.resetFilter();
    },
    /**
     * 校验条件树。
     *
     * <p><b>没选字段的条件行不参与校验</b>:条件查询支持「一个字段都不选」,
     * 这种行视为「未配置」,不参与过滤,也不报错 —— 存库前由
     * {@link pruneEmptyRows} 剔掉。</p>
     *
     * <p>选了字段但没选运算符/没填值的行仍要报错:那是配了一半的条件,
     * 静默丢掉会让用户拿到与预期不符的结果集。</p>
     */
    validateTree (group, path = '第 1 组', rowIdxRef = { i: 0 }) {
      const summary = [];
      const conditions = (group && group.conditions) || [];
      conditions.forEach((item) => {
        rowIdxRef.i += 1;
        const rowLabel = `${path}第 ${rowIdxRef.i} 行`;
        if (item.type === 'group') {
          const sub = this.validateTree(item, `${path}子组-`, { i: 0 });
          summary.push(...sub.summary);
          return;
        }
        // 一个字段都没选 = 该行未配置,跳过(行号照常递增,与界面上的行号对得上)
        if (!item.field) return;
        if (!item.operator) {
          summary.push(`${rowLabel}:请选择运算符`);
        }
        if (item.operator && operatorNeedsValue(item.operator)) {
          const hasValue = Array.isArray(item.value)
            ? item.value.length > 0
            : item.value !== null && item.value !== undefined && item.value !== '';
          if (!hasValue) {
            summary.push(`${rowLabel}:请填写值`);
          }
        }
        if (item.operator === 'between' && Array.isArray(item.value) && item.value.length === 1) {
          summary.push(`${rowLabel}:介于需同时填起止`);
        }
      });
      return { valid: summary.length === 0, summary };
    },
    /**
     * 校验排序项:每个排序字段都必须有排序方向。
     *
     * <p>批量排序(需求 LP262002 7.1.2.2):逐行校验,提示语带上行号。</p>
     */
    validateSort () {
      const summary = [];
      (this.sortList || []).forEach((item, idx) => {
        if (!item || !item.field) {
          summary.push(`排序第 ${idx + 1} 行:请选择字段`);
        } else if (!item.order) {
          summary.push(`排序第 ${idx + 1} 行:请选择排序方向`);
        }
      });
      return { valid: summary.length === 0, summary };
    },
    countNodes (group) {
      let count = 0;
      group.conditions.forEach(item => {
        if (item.type === 'group') count += this.countNodes(item);
        else count += 1;
      });
      return count;
    }
  }
};
</script>

<style lang="scss" scoped>
.m-custom-query-dialog {
  ::v-deep .el-dialog{
    height: 100%!important;
    width: 100%!important;
    margin: 0!important;
    border-radius: 0;
  }
  ::v-deep .el-dialog .el-dialog__body {
    height: calc(100% - 110px);
    max-height: calc(100% - 110px);
    padding: 20px;
  }
}
.c-cqd {
  overflow-y: auto;
  padding: 4px;
  ::v-deep .el-divider--horizontal{
    margin: 0;
  }
  &__tree {
    min-height: 60px;
  }
  &__tree-placeholder {
    padding: 16px 0;
    text-align: center;
    color: var(--leap-color-default-light-2);
    font-size: 13px;
  }
  &__tree-tip {
    margin-top: 8px;
    color: var(--leap-color-default-light-2);
    font-size: 12px;
  }
  &__presets {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0px 10px;
    border-radius: 4px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  &__presets-label {
    color: #606266;
    font-size: 13px;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  &__presets-required {
    color: #f56c6c;
  }
  &__presets-input {
    width: 280px;
  }
  &__alert {
    margin-bottom: 12px;
  }
  &__sort {
    margin-top: 24px;
    padding: 0px 10px;
    border-radius: 4px;
    &-content {
      display: block;
    }
  }
  &__sort-title {
    color: #606266;
    font-size: 13px;
    margin-bottom: 6px;
  }
  &__table {
    margin-top: 24px;
    padding: 0px 10px;
    border-radius: 4px;
    &-title {
      color: #606266;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
    }
  }
}
.dialog-footer {
  text-align: right;
}
</style>
