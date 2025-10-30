<template>
  <el-form-item label="">
    <el-button :loading="Loading" size="medium" type="primary" @click="$emit('submit')">查询</el-button>
    <el-button size="medium" @click="$emit('reset')">重置</el-button>
    <span v-if="isExpandable" class="icon-expand curPoint" @click="$emit('input', !value)">
      {{ value ? "收起" : "展开"}}
      <i :class="value ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
    </span>
  </el-form-item>
</template>

<script>
export default {
  name: 'PageSearchAction',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    isExpandable: {
      type: Boolean,
      default: true
    },
    Loading: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
/* 列表中展开和收起 */
.icon-expand {
  color: var(--aisDefaultTextColor);
  font-size: 14px;
  margin-left: 10px;
}
</style>
