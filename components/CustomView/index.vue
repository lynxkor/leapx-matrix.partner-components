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
        <draggable
          class="m-custom-view__list"
          :list="presets"
          :disabled="dragDisabled"
          handle=".m-custom-view__handle"
          animation="150"
          @end="onDragEnd"
        >
          <div
            v-for="p in presets"
            :key="p.id"
            class="m-custom-view__row"
          >
            <el-dropdown-item
              :command="p.id"
              :class="['m-custom-view__item', { 'is-active': activePresetId === p.id }]"
            >
              <i
                v-if="!presetFilterKeyword"
                class="el-icon-rank m-custom-view__handle"
                title="拖动排序"
              />
              <span class="m-custom-view__cnt m-custom-view__cnt--name">
                <span class="m-custom-view__label">
                  <TextEllipsis>{{ p.name }}</TextEllipsis>
                </span>
                <el-tag :type="perfStatusTagType(p)" size="mini" class="m-custom-view__perf">
                  {{ perfStatusLabel(p) }}
                </el-tag>
              </span>
              <span class="m-custom-view__cnt m-custom-view__cnt--action">
                <span class="m-custom-view__actions" @click.stop>
                  <i class="el-icon-top m-custom-view__action" title="置顶" @click.stop="onMoveToTop(p)" />
                  <i class="el-icon-edit m-custom-view__action" title="编辑" @click.stop="onEditView(p)" />
                  <i class="el-icon-delete m-custom-view__action m-custom-view__action--danger" title="删除" @click.stop="onDeleteView(p)" />
                </span>
                <i v-if="activePresetId === p.id" class="m-custom-view__action el-icon-check"></i>
              </span>
            </el-dropdown-item>
          </div>
        </draggable>
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
import draggable from 'vuedraggable';

export default {
  name: 'CustomView',
  components: { CustomQueryDialog, TextEllipsis, draggable },
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
    /**
     * 搜索态下禁用拖拽(需求 LP262042 7.1.2.2)。
     * 过滤后列表是 presets 的子集,拖拽子集会让「被过滤掉的视图」也参与重排,
     * 提交整表顺序时无法还原用户真实意图,所以搜索时直接禁用。
     */
    dragDisabled () {
      return !!(this.presetFilterKeyword || '').trim();
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
          // 下拉一次性取全量,不支持分页:视图数量按人均个位数,
          // 取 100 足够覆盖,避免用户视图较多时被截断在后半段(排序也会跟着失真)
          pageSize: 100
        });
        const records = (res && res.records) || [];
        this.presets = records.map(p => ({
          id: p.id,
          name: p.viewName,
          perfStatus: p.perfStatus || PERF_STATUS.PENDING,
          perfDurationMs: p.perfDurationMs,
          perfTestedAt: p.perfTestedTime
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
    /**
     * 拖拽结束:提交当前全部视图 id 的有序列表(需求 LP262042 7.1.2.2)。
     *
     * <p>整表覆盖语义,与后端 reorder 接口约定一致 —— 后端按数组下标重写 view_seq。
     * 权限判定统一交给后端:管理员与持有 DEALER_DATA_VIEW_ALL 的人由后端抛异常拒绝,
     * 前端不预判、不隐藏入口,统一按整表提交,失败时回滚为拖拽前的顺序。</p>
     *
     * <p>失败时回滚并交给 axios 拦截器弹错(拦截器已先弹错再 reject,
     * 这里不重复 $message.error)。</p>
     */
    async onDragEnd () {
      const ids = this.presets.map(p => p.id);
      // 拖动后 vuedraggable 就地改了 this.presets,提交前先快照一份用于回滚
      const snapshot = ids.slice();
      try {
        await customQueryViewApi.reorder(snapshot);
      } catch (e) {
        await this.loadPresets();
      }
    },
    /**
     * 置顶:等价于「把该项拖到最顶」,复用 reorder 接口提交整表新顺序。
     * 不再有独立的置顶接口与 is_top 字段,置顶就是排序的一种。
     */
    async onMoveToTop (preset) {
      const targetId = preset.id;
      const ids = this.presets.map(p => p.id).filter(id => id !== targetId);
      ids.unshift(targetId);
      try {
        await customQueryViewApi.reorder(ids);
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
      // 重复选择当前已锁定视图:activePresetId 值不变,mixin watch 不触发,
      // 且锁定态下页面刷新按钮被禁用,故这里走 refresh 通道强制刷新一次
      if (cmd === this.activePresetId) {
        this.$emit('refresh');
        this.$message.success(`已刷新视图「${preset.name}」`);
        return;
      }
      await this.applyPreset(preset);
    },
    // 选中视图:同步条件/排序/选中态到外层,由 store 驱动业务页按视图查询
    async applyPreset (preset) {
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
    // 保存弹窗测试通过后应用视图:刷新列表并选中;编辑的是当前已选中视图时走 refresh 通道
    async onDialogUpdatePresetId (id) {
      if (!id) return;
      await this.loadPresets();
      if (id === this.activePresetId) {
        this.$emit('refresh');
        return;
      }
      const preset = this.presets.find(p => p.id === id);
      if (preset) this.applyPreset(preset);
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
  &__list {
    max-height: 250px;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
  }
  // 拖拽行容器:vuedraggable 的 item 必须是真实元素,
  // 原来直接 v-for 在 el-dropdown-item 上,现在多包一层 div 承载拖拽
  &__row {
    position: relative;
  }
  // 拖拽手柄:只有按住它才能拖,避免与点击选择视图/下拉项冲突
  &__handle {
    cursor: move;
    color: #c0c4cc;
    margin-right: 6px;
    flex-shrink: 0;
    &:hover {
      color: var(--leap-color-primary);
    }
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
    padding: 0 0px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    &.is-active {
      color: var(--leap-color-primary);
      padding-right: 24px;
    }
  }
  &__cnt {
    display: flex;
    align-items: center;
  }
  // 视图名称区:占据除操作区外的全部剩余空间。
  // item 是 flex + space-between,若名称区按内容宽度自适应,
  // 短名称的行会把这部分富余空间分配到名称左侧,导致各行文字起始位置不一致
  // (表现为「视图名前面有空格」,实际数据里并没有空格)。
  // 名称区改为 flex:1 后富余空间被它吸收,文字始终紧贴拖拽手柄。
  &__cnt--name {
    flex: 1 1 auto;
    min-width: 0;
  }
  // 操作区:靠右贴边(名称区已占满剩余空间,这里只做兜底)
  &__cnt--action {
    margin-left: auto;
  }
  &__divided {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--leap-color-primary);
    transform: translateY(3px);
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
