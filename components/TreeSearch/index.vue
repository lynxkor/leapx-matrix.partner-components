<script>
/**
 * 树型下拉框组件
 * @author wangjinqing
 * @description
 *
 * @param {Object} treeProps - https://element.eleme.cn/#/zh-CN/component/tree
 * @param {Object} treeListeners - https://element.eleme.cn/#/zh-CN/component/tree
 *
 * 其他参数用法参考 Fetch-Select 组件
 * @example
  <tree-search
    :selectRef="onSelectRef"
    :style="{width: '305px', marginRight: '8px'}"
    filterable
    clearable
    remote
    reserve-keyword
    :value="ccc"
    :remote-method="cccRemote"
    :params="ccc"
    @change="handleCCC"
    placeholder="请输入CCC编码或名称"
    label-key="name"
    value-key="id"
    sub-label-key="code"
    :treeProps="{
      'default-expand-all': true,
      props: {
        children: 'children',
        label: 'name'
      },
    }"
    :treeListeners="{
      'node-click': handleNodeClick
    }"
  />
*/
</script>
<template>
  <base-search
    v-bind="$attrs"
    v-on="$listeners"
    isTree
    :treeProps="treeProps"
    :treeListeners="treeListeners"
    />
</template>
<script>
import BaseSearch from '../BaseSearch';
export default {
  name: 'TreeSearch',
  inheritAttrs: false,
  components: {
    BaseSearch,
  },
  props: {
    treeProps: {
      type: Object,
      default: () => ({}),
    },
    treeListeners: {
      type: Object,
      default: () => ({}),
    }
  },
  computed: {
  },
  mounted () {
  },
};
</script>
<style lang="scss" scoped>
</style>
