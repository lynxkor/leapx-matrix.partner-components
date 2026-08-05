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
          <i class="el-icon-document-checked" />
          视图名称
          <span class="c-cqd__presets-required">*</span>
        </span>
        <el-input
          v-model="viewName"
          placeholder="请输入视图名称(必填)"
          size="small"
          maxlength="50"
          show-word-limit
          class="c-cqd__presets-input"
        />
        <el-button
          size="small"
          icon="el-icon-cpu"
          :disabled="!currentPresetId"
          :loading="perfTesting"
          @click="onRunPerfTest"
        >性能测试</el-button>
      </div>

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

      <!-- 排序(单字段 + 升/降) -->
      <div class="c-cqd__sort">
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
        <div class="c-cqd__sort-hint">不选字段则按后端默认排序</div>
      </div>
    </div>

    <template v-slot:footer>
      <div class="dialog-footer">
        <el-button size="small" @click="onClear">清空</el-button>
        <el-button size="small" @click="onClose">取消</el-button>
        <el-button size="small" type="primary" @click="onApply">保存</el-button>
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
import * as customQueryViewApi from '@/api/datareport/customQueryView';

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
      fieldsMeta: getFields(),
      fieldsLoading: false
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
      try {
        const res = await customQueryViewApi.addOrUpdate(payload);
        return res || id || '';
      } catch (e) {
        return '';
      }
    },

    async onApply () {
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
      const newId = await this.buildAndSave(this.currentPresetId, name);
      if (!newId) return;
      this.currentPresetId = newId;
      this.$emit('update:active-preset-id', newId);
      this.$message.success('已保存视图');
      this.$emit('update:visible', false);
    },

    async onRunPerfTest () {
      if (!this.currentPresetId || this.perfTesting) return;
      const result = this.validateTree(this.workingTree);
      if (!result.valid) {
        this.errorSummary = result.summary;
        this.$message.warning('请先完善条件再测试');
        return;
      }
      this.errorSummary = [];
      this.perfTesting = true;
      try {
        const data = await customQueryViewApi.perf(this.currentPresetId);
        const status = data && data.perfStatus;
        const dur = data && data.perfDurationMs;
        this.$message[status === 'passed' ? 'success' : 'error'](
          `性能测试${status === 'passed' ? '通过' : '未通过'}:耗时 ${dur}ms`
        );
      } catch (e) {
        this.$message.error('性能测试失败');
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
  &__tree {
    min-height: 60px;
  }
  &__tree-placeholder {
    padding: 16px 0;
    text-align: center;
    color: #909399;
    font-size: 13px;
  }
  &__presets {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    margin-bottom: 12px;
    background: #f5f7fa;
    border-radius: 4px;
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
    margin-top: 12px;
    padding: 8px 10px;
    background: #f5f7fa;
    border-radius: 4px;
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
    color: #909399;
    font-size: 12px;
  }
}
.dialog-footer {
  text-align: right;
}
</style>
