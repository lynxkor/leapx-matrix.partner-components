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
        <div class="m-generic-view__list">
          <div
            v-for="item in rows"
            :key="item.id || '__default__'"
            class="m-generic-view__row"
          >
            <el-dropdown-item
              :command="item.id || '__default__'"
              :class="['m-generic-view__item', { 'is-active': isSelected(item) }]"
            >
              <span class="m-generic-view__label">
                <TextEllipsis>{{ item.viewName }}</TextEllipsis>
              </span>
              <span class="m-generic-view__actions" @click.stop v-if="item.id">
                <i
                  v-if="item.id != null"
                  class="el-icon-top m-generic-view__action"
                  title="置顶"
                  @click.stop="onMoveToTop(item)"
                />
                <i
                  v-if="item.id != null"
                  class="el-icon-delete m-generic-view__action m-generic-view__action--danger"
                  title="删除"
                  @click.stop="onDelete(item)"
                />
              </span>
              <i v-if="isSelected(item) && item.id" class="el-icon-check m-generic-view__check" />
            </el-dropdown-item>
          </div>
        </div>
        <div v-if="loading" class="m-generic-view__empty">加载中...</div>
        <div v-else-if="!hasSavedViews" class="m-generic-view__empty">
          暂无查询视图
        </div>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
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
  components: { TextEllipsis },
  props: {
    tableCode: { type: String, required: true }
  },
  data () {
    return {
      savedRows: [],
      loading: false
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
    rows () {
      return [{ id: null, viewName: DEFAULT_VIEW_NAME }, ...this.savedRows];
    },
    hasSavedViews () {
      return this.savedRows.length > 0;
    }
  },
  methods: {
    isSelected (item) {
      if (item.id === null || item.id === undefined) {
        return this.selectedId === null || this.selectedId === undefined;
      }
      return this.selectedId === item.id;
    },
    onVisibleChange (visible) {
      if (visible) this.load();
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
    async onMoveToTop (item) {
      try {
        await personalQueryViewApi.moveToTop(item.id);
        this.$message.success(`已将视图「${item.viewName}」置顶`);
        await this.load();
      } catch (e) {
        // axios 拦截器已提示错误
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
