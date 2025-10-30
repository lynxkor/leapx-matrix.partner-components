<template>
  <el-form-item label="">
    <el-button :loading="Loading" size="mini" type="primary" @click="$emit('submit')">查询</el-button>
    <el-button size="mini" @click="$emit('reset')">清空</el-button>
    <span v-if="isExpandable" class="screen curPoint" @click="$emit('input', !value)">
      {{ value ? "收起查询条件" : "展开查询条件"}}
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
