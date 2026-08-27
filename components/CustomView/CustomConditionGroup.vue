<template>
  <div :class="['c-cg', { 'c-cg--nested': depth > 0, 'bg-grey': depth%2 === 1, 'c-cg--collapsed': collapsed }]">
    <!-- 组头部:折叠开关 + AND/OR 切换 + 行数提示 + 删除按钮(子组才显示) -->
    <div class="label-logic">{{ localGroup.logic === 'AND' ? '且' : '或' }}</div>
    <div class="c-cg__head">
      <i
        :class="['c-cg__caret', collapsed ? 'el-icon-plus' : 'el-icon-minus']"
        @click="toggleCollapsed"
      />
      <el-dropdown
        trigger="click"
        :disabled="disabled"
        @command="onLogicChange"
      >
        <el-button size="mini" class="c-cg__logic-trigger">
          {{ localGroup.logic === 'AND' ? '且' : '或' }}
          <i class="el-icon-arrow-down" />
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="AND">且</el-dropdown-item>
          <el-dropdown-item command="OR">或</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <!-- <span class="c-cg__hint">满足以下 {{ localGroup.conditions.length }} 条</span> -->
      <el-button
        v-if="removable && !disabled"
        icon="el-icon-delete"
        size="mini"
        @click.stop="$emit('remove')"
      >删除分组</el-button>
    </div>

    <!-- 行/子分组列表 -->
    <div v-show="!collapsed">
      <div
        v-for="(item, idx) in localGroup.conditions"
        :key="item.id"
        class="c-cg__item"
      >
      <span class="c-cg__sep">
        <!-- {{ idx === 0 ? '·' : (localGroup.logic === 'AND' ? '且' : '或') }} -->
      </span>
      <custom-condition-row
        v-if="item.type !== 'group'"
        :row="item"
        :fields="fields"
        :disabled="disabled"
        @remove="removeAt(idx)"
        @change="onChildChange(idx, $event)"
      />
      <custom-condition-group
        v-else
        :group="item"
        :fields="fields"
        :depth="depth + 1"
        :removable="true"
        :disabled="disabled"
        @remove="removeAt(idx)"
        @change="onChildChange(idx, $event)"
      />
      </div>
    </div>

    <!-- 操作区 -->
    <div v-if="!disabled" class="c-cg__ops">
      <el-button size="mini" icon="el-icon-plus" @click="addRow">加条件</el-button>
      <el-tooltip
        :disabled="depth < 4"
        :content="depth >= 4 ? '已达最大嵌套层级 5' : ''"
        placement="top"
      >
        <el-button
          size="mini"
          icon="el-icon-folder-add"
          :disabled="depth >= 4"
          @click="addGroup"
        >加分组</el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import CustomConditionRow from './CustomConditionRow.vue';
import { createEmptyRow, createEmptyGroup, cloneTree } from './fieldMeta';

export default {
  name: 'CustomConditionGroup',
  components: { CustomConditionRow },
  props: {
    group: {
      type: Object,
      required: true
    },
    fields: {
      type: Array,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    removable: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      localGroup: cloneTree(this.group),
      collapsed: false
    };
  },
  watch: {
    group: {
      handler (val) {
        // Guard against re-emit loop (same as CustomConditionRow).
        // Parent splice returns group prop as new ref with same content.
        if (JSON.stringify(val) === JSON.stringify(this.localGroup)) return;
        this.localGroup = cloneTree(val);
      },
      deep: true
    },
    localGroup: {
      handler (val) {
        this.$emit('change', cloneTree(val));
      },
      deep: true
    }
  },
  methods: {
    toggleCollapsed () {
      this.collapsed = !this.collapsed;
    },
    onLogicChange (val) {
      this.localGroup.logic = val;
    },
    addRow () {
      this.localGroup.conditions.push(createEmptyRow());
      this.emitChange();
    },
    addGroup () {
      if (this.depth >= 4) return;
      this.localGroup.conditions.push(createEmptyGroup('AND'));
      this.emitChange();
    },
    removeAt (idx) {
      this.localGroup.conditions.splice(idx, 1);
      if (this.localGroup.conditions.length === 0) {
        this.localGroup.conditions.push(createEmptyRow());
      }
      this.emitChange();
    },
    onChildChange (idx, newChild) {
      this.localGroup.conditions.splice(idx, 1, newChild);
      this.emitChange();
    },
    emitChange () {
      this.$emit('change', cloneTree(this.localGroup));
    }
  }
};
</script>

<style lang="scss" scoped>
.c-cg {
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  .label-logic {
    width: 20px;
    height: 20px;
    background-color: var(--leap-color-primary-light-9);
    color: var(--leap-color-primary);
    text-align: center;
    line-height: 20px;
    font-size: 12px;
    position: absolute;
    top: 50%;
    transform: translate(-2px, 0px);
  }

  &::before{
    content: ' ';
    width: 2px;
    position: absolute;
    left: 23px;
    top: 38px;
    bottom: 16px;
    background-color: var(--leap-color-default-light-2);
  }
  &--nested {
    padding: 16px;
    border: 1px solid #dcdfe6;
    background: #fff;
    position: relative;
    &.bg-grey {
      background-color: var(--leap-color-default-light-6);
    }
  }
  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  &__caret {
    cursor: pointer;
    color: var(--leap-color-default-light-1);
    font-size: 10px;
    border: 1px solid var(--leap-color-default-light-1);
    border-radius: 2px;
    padding: 2px;
    user-select: none;
    font-weight: bold;
    &:hover {
      color: var(--leap-color-primary);
    }
  }
  &__logic-trigger {
    .el-icon-arrow-down {
      font-size: 10px;
    }
  }
  &__hint {
    color: #909399;
    font-size: 12px;
  }
  &__remove {
    margin-left: auto;
    color: var(--leap-color-danger);
    padding: 2px 6px;
  }
  &__item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  &__sep {
    flex-shrink: 0;
    width: 24px;
    text-align: right;
    color: #909399;
    font-size: 12px;
    padding-top: 6px;
  }
  &__ops {
    padding-left: 30px;
  }
}
</style>
