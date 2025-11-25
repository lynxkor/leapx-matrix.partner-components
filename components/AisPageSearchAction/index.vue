<template>
  <el-form-item label=" " class="form-item-action">
    <el-button :loading="Loading" size="medium" class="btn-search" @click="$emit('submit')">查询</el-button>
    <el-button size="medium" class="btn-reset" @click="$emit('reset')">重置</el-button>
    <span v-if="isExpandable" class="icon-expand curPoint" @click="$emit('input', !value)">
      {{ value ? "收起" : "展开"}}
      <i :class="value ? 'iconfont icon-lxppc-up' : 'iconfont icon-lxppc-down'"></i>
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
  display: inline-block;
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  text-align: center;
  &:hover, &:focus{
    background-color: #F8F7F7;
  }
}
.btn-search{
  border: 1px solid var(--themColor);
  color: var(--themColor);
  font-weight: 400;
  &:hover, &:focus{
    background-color: var(--themColor);
    color: #fff;
  }
}
.btn-reset{
  color: var(--aisDefaultTextColor);
  font-weight: normal;
  font-weight: 400;
  &:hover, &:focus{
    background-color: #fff;
    color: var(--themColor);
    border: 1px solid var(--themColor);
  }
}
</style>
