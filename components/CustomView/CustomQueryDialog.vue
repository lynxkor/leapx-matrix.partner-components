<template>
  <el-dialog
    title="自定义条件查询"
    :visible.sync="dialogVisible"
    class="m-custom-query-dialog"
    width="80%"
    :close-on-click-modal="false"
    @close="onClose"
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
      </div>

      <el-divider></el-divider>
      <!-- 排序(单字段 + 升/降) -->
      <div class="c-cqd__sort">
        <div class="c-cqd__sort-content">
          <div class="c-cqd__sort-title">排序</div>
          <div class="c-cqd__sort-row">
            <el-select
              v-model="workingSort.field"
              placeholder="选择排序字段"
              size="small"
              filterable
              clearable
              class="c-cqd__sort-field"
            >
              <el-option
                v-for="f in fields"
                :key="f.key"
                :value="f.key"
                :label="f.label"
              />
            </el-select>
            <el-radio-group v-model="workingSort.order" size="small" :disabled="!workingSort.field">
              <el-radio-button label="asc">升序</el-radio-button>
              <el-radio-button label="desc">降序</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <div class="c-cqd__sort-hint">不选字段则按后端默认排序</div>
      </div>
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
import {
  loadFields,
  getFields,
  createEmptyRow,
  cloneTree,
  operatorNeedsValue
} from './fieldMeta';
import { resolveSortList } from './sortJson';
import * as customQueryViewApi from '@/libs/api/customView/customQueryView';

export default {
  name: 'CustomQueryDialog',
  components: { CustomConditionGroup },
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
    }
  },
  data () {
    return {
      dialogVisible: this.visible,
      workingTree: this.makeInitialTree(),
      workingSort: this.makeInitialSort(),
      errorSummary: [],
      viewName: '',
      currentPresetId: null,
      perfTesting: false,
      applying: false,
      fieldsMeta: getFields(),
      fieldsLoading: false,
      /**
       * 批量排序列表(需求 LP262002 7.1.2.2 多字段排序)。
       *
       * <p>本组件自带的排序区仍是单字段的(workingSort),本字段承载
       * 「多字段排序」能力:由外部(合并了多字段排序 UI 的弹窗)设置
       * {@code presetSortJson} 后随视图一起保存。</p>
       */
      presetSortJson: '',
      /**
       * 从视图详情解析出来的排序项列表 [{field, order}]。
       * 优先取 sortJson(多字段),历史数据回落到旧的 sortField / sortOrder。
       */
      presetSortList: []
    };
  },
  computed: {
    fields () {
      return this.fieldsMeta;
    }
  },
  watch: {
    visible (val) {
      this.dialogVisible = val;
      if (val) {
        this.workingTree = this.makeInitialTree();
        this.workingSort = this.makeInitialSort();
        this.presetSortJson = '';
        this.presetSortList = [];
        this.errorSummary = [];
        this.viewName = '';
        this.currentPresetId = this.activePresetId || null;
        this.fetchFields();
        if (this.currentPresetId) {
          this.loadPresetDetail(this.currentPresetId);
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
      return {
        logic: 'AND',
        conditions: [createEmptyRow()]
      };
    },
    makeInitialSort () {
      if (this.sort && this.sort.field) {
        return { field: this.sort.field, order: this.sort.order };
      }
      return { field: null, order: null };
    },
    onTreeChange (newTree) {
      this.workingTree = newTree;
    },

    async loadPresetDetail (id) {
      try {
        const data = await customQueryViewApi.getDetail(id);
        if (!data) return;
        this.viewName = data.viewName || '';
        const tree = data.conditionTree ? JSON.parse(data.conditionTree) : this.makeInitialTree();
        this.workingTree = cloneTree(tree);
        this.workingSort = data.sortField
          ? { field: data.sortField, order: data.sortOrder }
          : this.makeInitialSort();
        // 批量排序(多字段):优先 sortJson,历史数据回落到旧的 sortField / sortOrder。
        // 外部的「多字段排序」UI 读这个列表来回填。
        this.presetSortList = resolveSortList(data);
      } catch (e) {
        this.$message.error('加载视图详情失败');
      }
    },

    async buildAndSave (id, name) {
      const payload = {
        id: id || null,
        bizKey: this.bizKey,
        viewName: name,
        conditionTree: JSON.stringify(this.workingTree),
        sortField: this.workingSort.field || '',
        sortOrder: this.workingSort.field && this.workingSort.order ? this.workingSort.order : ''
      };
      // 批量排序(多字段,需求 LP262002 7.1.2.2):外部设置了 presetSortJson 就走新字段,
      // 并且不再带旧的单字段排序 —— 两套字段不并存,读取侧优先用 sortJson。
      if (this.presetSortJson) {
        payload.sortJson = this.presetSortJson;
        payload.sortField = '';
        payload.sortOrder = '';
      }
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
        this.workingTree = {
          logic: 'AND',
          conditions: [createEmptyRow()]
        };
        this.workingSort = this.makeInitialSort();
        this.errorSummary = [];
      }).catch(() => {});
    },
    onClose () {
      this.$emit('update:visible', false);
    },
    validateTree (group, path = '第 1 组', rowIdxRef = { i: 0 }) {
      const summary = [];
      group.conditions.forEach((item) => {
        rowIdxRef.i += 1;
        const rowLabel = `${path}第 ${rowIdxRef.i} 行`;
        if (item.type === 'group') {
          const sub = this.validateTree(item, `${path}子组-`, { i: 0 });
          summary.push(...sub.summary);
          return;
        }
        if (!item.field) {
          summary.push(`${rowLabel}:请选择字段`);
        }
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
    validateSort () {
      const summary = [];
      if (this.workingSort.field && !this.workingSort.order) {
        summary.push('排序:请选择顺序');
      }
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
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  &__sort-title {
    color: #606266;
    font-size: 13px;
    margin-bottom: 6px;
  }
  &__sort-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }
  &__sort-field {
    width: 240px;
  }
  &__sort-hint {
    color: var(--leap-color-default-light-2);
    font-size: 12px;
    padding-left: 36px;
  }
}
.dialog-footer {
  text-align: right;
}
</style>
