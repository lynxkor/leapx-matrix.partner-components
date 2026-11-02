<template>
  <div class="m-generic-view">
    <el-dropdown
      trigger="click"
      placement="bottom-start"
      class="m-generic-view__dropdown"
      :append-to-body="false"
      @command="onCommand"
      @visible-change="onVisibleChange"
    >
      <el-button size="small" class="m-generic-view__trigger">
        <span class="m-generic-view__trigger_text">
          <TextEllipsis>{{ displayName }}</TextEllipsis>
        </span>
        <i class="el-icon-arrow-down el-icon--right" />
        <i
          v-if="selectedId"
          class="el-icon-close m-generic-view__clear"
          @click.stop="handleClear"
        />
      </el-button>

      <el-dropdown-menu slot="dropdown">
        <!-- 搜索：本地过滤；搜索态禁用拖拽，避免过滤子集被提交成整表顺序 -->
        <div class="m-generic-view__search" @mousedown.stop @click.stop>
          <el-input
            v-model="filterKeyword"
            size="mini"
            placeholder="搜索查询视图"
            clearable
            prefix-icon="el-icon-search"
          />
        </div>
        <!-- 默认查询视图：后端内存组装、不落库，恒定第一位，不可拖拽 -->
        <el-dropdown-item
          command="__default__"
          :class="['m-generic-view__item', { 'is-active': !selectedId }]"
        >
          <span class="m-generic-view__label">
            <TextEllipsis>{{ DEFAULT_VIEW_NAME }}</TextEllipsis>
          </span>
          <i v-if="!selectedId" class="el-icon-check m-generic-view__check" />
        </el-dropdown-item>
        <draggable
          class="m-generic-view__list"
          :list="rowsForList"
          :disabled="searching"
          handle=".m-generic-view__handle"
          animation="150"
          @end="onDragEnd"
        >
          <div
            v-for="item in rowsForList"
            :key="item.id"
            class="m-generic-view__row"
          >
            <el-dropdown-item
              :command="item.id"
              :class="['m-generic-view__item', { 'is-active': selectedId === item.id }]"
            >
              <i
                v-if="!searching"
                class="el-icon-rank m-generic-view__handle"
                title="拖动排序"
              />
              <span class="m-generic-view__label">
                <TextEllipsis>{{ item.viewName }}</TextEllipsis>
              </span>
              <span class="m-generic-view__actions" @click.stop>
                <i
                  class="el-icon-top m-generic-view__action"
                  title="置顶"
                  @click.stop="onMoveToTop(item)"
                />
                <i
                  class="el-icon-delete m-generic-view__action m-generic-view__action--danger"
                  title="删除"
                  @click.stop="onDelete(item)"
                />
              </span>
              <i v-if="selectedId === item.id" class="el-icon-check m-generic-view__check" />
            </el-dropdown-item>
          </div>
        </draggable>
        <div v-if="loading" class="m-generic-view__empty">加载中...</div>
        <div v-else-if="searching && !rowsForList.length" class="m-generic-view__empty">
          未找到匹配的查询视图
        </div>
        <div v-else-if="!searching && !savedRows.length" class="m-generic-view__empty">
          暂无查询视图
        </div>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import * as personalQueryViewApi from '@/libs/api/personalQueryView';
import {
  state,
  DEFAULT_VIEW_NAME,
  apply,
  clearSelection,
  parseCondition
} from '@/libs/store/personalQueryView';
import TextEllipsis from '@/libs/components/TextEllipsis';

export default {
  name: 'GenericView',
  components: { TextEllipsis, draggable },
  props: {
    tableCode: { type: String, required: true }
  },
  data () {
    return {
      savedRows: [],
      loading: false,
      filterKeyword: '',
      DEFAULT_VIEW_NAME
    };
  },
  computed: {
    bucket () {
      return state.cache[this.tableCode] || null;
    },
    selectedId () {
      return this.bucket ? this.bucket.selectedId : null;
    },
    displayName () {
      return (this.bucket && this.bucket.selectedName) || DEFAULT_VIEW_NAME;
    },
    searching () {
      return !!(this.filterKeyword || '').trim();
    },
    filteredRows () {
      const kw = (this.filterKeyword || '').trim().toLowerCase();
      return this.savedRows.filter(row => (row.viewName || '').toLowerCase().includes(kw));
    },
    /**
     * 渲染与拖拽共用同一数组：搜索态渲染过滤子集但禁用拖拽；
     * 拖拽只在全量列表进行，提交整表顺序即用户所见顺序。
     */
    rowsForList () {
      return this.searching ? this.filteredRows : this.savedRows;
    }
  },
  methods: {
    onVisibleChange (visible) {
      if (visible) {
        this.filterKeyword = '';
        this.load();
      }
    },
    handleClear () {
      apply(this.tableCode, { id: null, name: '', queryCondition: null });
    },
    async load () {
      const code = this.tableCode;
      // 快速切页/连点下拉时只认最后一次请求,避免旧响应覆盖新页面数据
      const seq = (this._loadSeq || 0) + 1;
      this._loadSeq = seq;
      this.loading = true;
      try {
        const data = await personalQueryViewApi.list(code);
        if (seq !== this._loadSeq || code !== this.tableCode) return;
        const records = Array.isArray(data) ? data : [];
        // 后端首项是虚拟默认视图(isDefault=1),前端固定渲染,不重复展示
        this.savedRows = records.filter(item =>
          item && item.id !== null && item.id !== undefined && Number(item.isDefault) !== 1
        );
        if (this.selectedId !== null && this.selectedId !== undefined &&
          !this.savedRows.some(item => item.id === this.selectedId)) {
          clearSelection(code);
        }
      } catch (e) {
        // axios 拦截器已提示错误,保留上一次列表
      } finally {
        if (seq === this._loadSeq) this.loading = false;
      }
    },
    onCommand (cmd) {
      if (cmd === '__default__') {
        apply(this.tableCode, { id: null, name: '', queryCondition: null });
        return;
      }
      const item = this.savedRows.find(row => row.id === cmd);
      if (!item) return;
      const condition = parseCondition(item);
      if (condition === null) {
        this.$message.error(`查询视图「${item.viewName}」的条件格式错误`);
        return;
      }
      apply(this.tableCode, {
        id: item.id,
        name: item.viewName,
        queryCondition: condition
      });
    },
    /**
     * 拖拽结束（需求 LP262042 7.1.2.2）：提交当前全部自建视图 id 的有序列表。
     * 整表覆盖语义 —— 后端按数组下标重写 sort_no；vuedraggable 已就地更新 savedRows，
     * 失败时回滚为服务端排序（拦截器已先弹错再 reject，这里不重复 $message.error）。
     */
    async onDragEnd () {
      try {
        await personalQueryViewApi.reorder(this.savedRows.map(row => row.id));
      } catch (e) {
        await this.load();
      }
    },
    /**
     * 置顶：等价于「把该项拖到最顶」，复用 reorder 接口提交整表新顺序
     * （与左侧高级视图 CustomView 的置顶实现一致，不再单独保留置顶接口）。
     */
    async onMoveToTop (item) {
      const targetId = item.id;
      const ids = this.savedRows.map(row => row.id).filter(id => id !== targetId);
      ids.unshift(targetId);
      try {
        await personalQueryViewApi.reorder(ids);
        await this.load();
        this.$message.success(`已将视图「${item.viewName}」置顶`);
      } catch (e) {
        // axios 拦截器已提示错误，这里回滚为服务端当前顺序
        await this.load();
      }
    },
    onDelete (item) {
      this.$confirm(`确认删除视图「${item.viewName}」?删除后不可恢复。`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await personalQueryViewApi.remove(item.id);
          if (this.selectedId === item.id) {
            apply(this.tableCode, { id: null, name: '', queryCondition: null });
          }
          await this.load();
          this.$message.success('已删除视图');
        } catch (e) {
          // axios 拦截器已提示错误
        }
      }).catch(() => {});
    }
  }
};
</script>

<style lang="scss" scoped>
.m-generic-view {
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
  &__row {
    position: relative;
  }
  &__label {
    max-width: 155px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
    // 吃掉把手与操作区之间的剩余空间:配合父级 space-between,
    // 否则视图名较短时(如 17 位 VIN)把手与文字之间会留出空洞。
    // min-width:0 允许 flex 子项收缩,保证省略号生效。
    flex: 1 1 auto;
    min-width: 0;
  }
  &__handle {
    padding: 4px;
    cursor: move;
    border-radius: 3px;
    font-size: 13px;
    color: #909399;
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
  }
  &__check {
    padding: 4px;
    font-size: 13px;
    color: var(--leap-color-primary);
  }
  &__item {
    padding: 0 0 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    min-width: 120px;
    &.is-active {
      color: var(--leap-color-primary);
    }
  }
  ::v-deep .el-dropdown-menu__item:hover &__actions {
    opacity: 1;
  }
}
</style>
