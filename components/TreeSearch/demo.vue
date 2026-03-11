<template>
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
      'render-content': renderContent
    }"
    :treeListeners="{
      'node-click': handleNodeClick
    }"
  />
</template>
<script>
import TreeSearch from '@/libs/components/TreeSearch';
export default {
  components: {
    TreeSearch,
  },
  data () {
    return {
      selectRef: null
    };
  },
  methods: {
    onSelectRef (el) {
      this.selectRef = el;
    },
    handleNodeClick (data, node) {
      if (!node.isLeaf) {
        return;
      }
      this.selectRef.blur();
      // 新增
      // serviceActivityFaultUpdate({
      //   cccId: data.id,
      //   activityId: this.id,
      // }).then(res => {
      //   this.getData();
      // });
    },
    // 自定义渲染内容
    renderContent (h, { node, data, store }) {
      const isLeaf = node.isLeaf;
      return h('div', {
        class: {
          'is-leaf': isLeaf,
        },
      }, [
        h('span', {
          class: 'node-label'
        }, node.label)
      ]);
    }
  }
};
</script>
