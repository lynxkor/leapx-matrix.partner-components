<template>
  <el-dropdown
    trigger="hover"
    style="vertical-align: middle;"
    @command="(command) => $emit('command', command)"
    >
    <span class="el-dropdown-link">
      <i class="iconfont icon-lxppc-down"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        v-for="menu in menus"
        :key="menu.value"
        :command="menu.value">
        {{menu.label}}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>
<script>
export default {
  name: 'DropdownActions',
  inheritAttrs: false,
  props: {
    menus: {
      type: [Array],
      default: () => ([]),
    },
  }
};

</script>
<style lang="scss" scoped></style>
