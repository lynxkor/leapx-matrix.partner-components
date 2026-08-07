<template>
  <div class="m-custom-view">
    <el-dropdown
      trigger="click"
      placement="bottom-start"
      class="m-custom-view__dropdown"
      :append-to-body="false"
      @command="onDropdownCommand"
      @visible-change="onDropdownVisibleChange"
    >
      <template v-if="$scopedSlots.trigger">
        <div @click.stop>
          <slot
            name="trigger"
            :label="activePresetName || triggerText"
            :clearable="!!activePresetId"
            :onClear="handleClearPreset"
          />
        </div>
      </template>
      <template v-else>
        <el-button size="small" class="m-custom-view__trigger">
          <span class="m-custom-view__trigger_text">
            <TextEllipsis>{{ activePresetName || triggerText }}</TextEllipsis>
          </span>
          <i class="el-icon-arrow-down el-icon--right" />
          <i
            v-if="activePresetId"
            class="el-icon-close m-custom-view__clear"
            @click.stop="handleClearPreset"
          />
        </el-button>
      </template>

      <el-dropdown-menu slot="dropdown">
        <div class="m-custom-view__search" @click.stop>
          <el-input
            v-model="presetFilterKeyword"
            size="mini"
            placeholder="搜索视图名称"
            clearable
            prefix-icon="el-icon-search"
          />
        </div>
        <el-dropdown-item
          v-if="defaultViewVisible"
          command="__default__"
          :class="['m-custom-view__item', { 'is-active': !activePresetId }]"
        >
          <span class="m-custom-view__label">默认视图</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-for="p in filteredPresets"
          :key="p.id"
          :command="p.id"
          :class="['m-custom-view__item', { 'is-active': activePresetId === p.id }]"
        >
          <span class="m-custom-view__label">
            <TextEllipsis>{{ p.name }}</TextEllipsis>
          </span>
          <el-tag :type="perfStatusTagType(p)" size="mini" class="m-custom-view__perf">
            {{ perfStatusLabel(p) }}
          </el-tag>
          <span class="m-custom-view__actions" @click.stop>
            <i class="el-icon-top m-custom-view__action" title="置顶" @click.stop="onMoveToTop(p)" />
            <i class="el-icon-edit m-custom-view__action" title="编辑" @click.stop="onEditView(p)" />
            <i class="el-icon-delete m-custom-view__action m-custom-view__action--danger" title="删除" @click.stop="onDeleteView(p)" />
          </span>
          <i v-if="activePresetId === p.id" class="m-custom-view__action el-icon-check"></i>
        </el-dropdown-item>
        <el-dropdown-item divided command="__new__" class="m-custom-view__divided">
          <i class="el-icon-plus" />
          <span class="m-custom-view__label">新增视图</span>
        </el-dropdown-item>
        <div
          v-if="presetFilterKeyword && !defaultViewVisible && filteredPresets.length === 0"
          class="m-custom-view__empty"
        >未找到匹配的视图</div>
      </el-dropdown-menu>
    </el-dropdown>

    <CustomQueryDialog
      :visible.sync="dialogVisible"
      :active-preset-id="editingPresetId"
      :biz-key="bizKey"
      @update:active-preset-id="onDialogUpdatePresetId"
    />
  </div>
</template>

<script>
import CustomQueryDialog from './CustomQueryDialog.vue';
import { PERF_STATUS } from './perfStatus';
import * as customQueryViewApi from '@/libs/api/customView/customQueryView';
import TextEllipsis from '@/libs/components/TextEllipsis';

export default {
  name: 'CustomView',
  components: { CustomQueryDialog, TextEllipsis },
  props: {
    value: { type: [Object, null], default: null },
    sortColumns: { type: Array, default: () => [] },
    activePresetId: { type: [String, null], default: null },
    triggerText: { type: String, default: '默认视图' },
    bizKey: { type: String, required: true }
  },
  data () {
    return {
      presets: [],
      presetFilterKeyword: '',
      editingPresetId: null,
      dialogVisible: false,
      loading: false
    };
  },
  computed: {
    activePresetName () {
      if (!this.activePresetId) return '';
      const preset = this.presets.find(p => p.id === this.activePresetId);
      return preset ? preset.name : '';
    },
    filteredPresets () {
      const kw = (this.presetFilterKeyword || '').trim().toLowerCase();
      if (!kw) return this.presets;
      return this.presets.filter(p => (p.name || '').toLowerCase().includes(kw));
    },
    defaultViewVisible () {
      const kw = (this.presetFilterKeyword || '').trim().toLowerCase();
      return !kw || '默认视图'.toLowerCase().includes(kw);
    }
  },
  watch: {
    dialogVisible (val) {
      if (!val) this.editingPresetId = null;
    }
  },
  mounted () {
    this.loadPresets();
  },
  methods: {
    perfStatusLabel (preset) {
      const s = preset.perfStatus || PERF_STATUS.PENDING;
      if (s === PERF_STATUS.PASSED) return '已通过';
      if (s === PERF_STATUS.FAILED) return '未通过';
      return '待测试';
    },
    perfStatusTagType (preset) {
      const s = preset.perfStatus || PERF_STATUS.PENDING;
      if (s === PERF_STATUS.PASSED) return 'success';
      if (s === PERF_STATUS.FAILED) return 'danger';
      return 'warning';
    },
    async loadPresets () {
      if (this.loading) return;
      this.loading = true;
      try {
        const res = await customQueryViewApi.page({
          bizKey: this.bizKey,
          pageNum: 1,
          pageSize: 50
        });
        const records = (res && res.records) || [];
        this.presets = records.map(p => ({
          id: p.id,
          name: p.viewName,
          perfStatus: p.perfStatus || PERF_STATUS.PENDING,
          perfDurationMs: p.perfDurationMs,
          perfTestedAt: p.perfTestedTime,
          isTop: p.isTop
        }));
        if (this.activePresetId && !this.presets.some(p => p.id === this.activePresetId)) {
          this.handleClearPreset();
        }
      } catch (e) {
        this.presets = [];
        this.$message.error('加载视图列表失败');
      } finally {
        this.loading = false;
      }
    },
    onDropdownVisibleChange (visible) {
      if (visible) {
        this.loadPresets();
      } else {
        this.presetFilterKeyword = '';
      }
    },
    handleClearPreset () {
      this.$emit('update:activePresetId', null);
      this.$emit('input', null);
      this.$emit('update:sortColumns', []);
      this.$emit('change', { conditions: null, sortColumns: [], activePresetId: null });
    },
    async onMoveToTop (preset) {
      try {
        await customQueryViewApi.pin(preset.id);
        await this.loadPresets();
        this.$message.success(`已将视图「${preset.name}」置顶`);
      } catch (e) {
        this.loadPresets();
      }
    },
    onEditView (preset) {
      this.editingPresetId = preset.id;
      this.dialogVisible = true;
    },
    onDeleteView (preset) {
      this.$confirm(`确认删除视图「${preset.name}」?删除后不可恢复。`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await customQueryViewApi.deleteItems([preset.id]);
          await this.loadPresets();
          if (this.activePresetId === preset.id) {
            this.handleClearPreset();
          }
          this.$message.success('已删除视图');
        } catch (e) {
          this.loadPresets();
        }
      }).catch(() => {});
    },
    async onDropdownCommand (cmd) {
      if (cmd === '__default__') {
        this.handleClearPreset();
        return;
      }
      if (cmd === '__new__') {
        this.$emit('update:activePresetId', null);
        this.$emit('input', null);
        this.editingPresetId = null;
        this.dialogVisible = true;
        return;
      }
      const preset = this.presets.find(p => p.id === cmd);
      if (!preset) return;
      if (preset.perfStatus !== PERF_STATUS.PASSED) {
        this.$message.warning(`视图「${preset.name}」未通过性能测试,不能用于查询,请先在管理视图中完成测试`);
        return;
      }
      try {
        const data = await customQueryViewApi.getDetail(preset.id);
        if (!data) return;
        const tree = data.conditionTree ? JSON.parse(data.conditionTree) : null;
        const sortColumns = data.sortField
          ? [{ column: data.sortField, sort: data.sortOrder.toUpperCase() }]
          : [];
        this.$emit('update:activePresetId', preset.id);
        this.$emit('input', tree);
        this.$emit('update:sortColumns', sortColumns);
        this.$emit('change', {
          conditions: tree,
          sortColumns,
          activePresetId: preset.id
        });
        this.$message.success(`已使用视图「${preset.name}」,表单已锁定`);
      } catch (e) {
        this.$message.error('加载视图详情失败');
      }
    },
    onDialogUpdatePresetId (id) {
      if (id !== this.editingPresetId) {
        this.editingPresetId = id;
        this.loadPresets();
        // 弹窗保存成功(id 由 null 变为新增/更新后的视图 id),
        // 补发 update:activePresetId 让 AisPageTitle 写入 store → mixin watcher 触发,
        // 自动按新 viewId 走 executeQuery 取数;
        // (AisPageTitle 未监听 @change,故仅靠 change 无法驱动取数)
        this.$emit('update:activePresetId', id);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.m-custom-view {
  display: inline-block;
  &__trigger {
    ::v-deep &>span {
      display: flex;
      align-items: center;
    }
    &_text {
      max-width: 155px;
      display: inline-block;
    }
  }
  &__clear {
    margin-left: 6px;
    padding: 0 4px;
    font-size: 14px;
    border-radius: 50%;
    &:hover {
      color: var(--leap-color-primary);
    }
  }
  &__search {
    padding: 2px 10px 10px 10px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 6px;
  }
  &__empty {
    padding: 12px;
    text-align: center;
    color: #909399;
    font-size: 12px;
  }
  &__label {
    max-width: 155px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
  }
  &__perf {
    margin-left: 8px;
    height: 18px;
    line-height: 18px;
    padding: 0 6px;
  }
  &__actions {
    display: inline-flex;
    gap: 4px;
    margin-left: 8px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  &__action {
    padding: 4px;
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.08);
      color: var(--leap-color-primary);
    }
    &--danger:hover {
      color: var(--leap-color-danger);
    }
    &.el-icon-check{
      position: absolute;
      right: 0px;
    }
  }
  &__item {
    padding: 0 24px 0 12px;
    display: flex;
    align-items: center;
    &.is-active {
      color: var(--leap-color-primary);
    }
  }
  &__divided {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--leap-color-primary);
    &::before {
      margin: 0;
    }
    &:hover {
      background: #fff;
      color: var(--leap-color-primary);
    }
  }
  ::v-deep .el-dropdown-menu__item &__perf.el-tag {
    margin-left: 4px;
    height: 18px;
    line-height: 18px;
    padding: 0 6px;
  }
  ::v-deep .el-dropdown-menu__item:hover &__actions {
    opacity: 1;
  }
}
</style>
