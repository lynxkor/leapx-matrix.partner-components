<template>
  <div class="fetch-box">
    <slot></slot>
  </div>
</template>
<script>
export default {
  methods: {
  }
};
</script>
<style lang="scss" scoped>
.fetch-box{
  display: flex;

  ::v-deep .el-input__inner{
    border-bottom-right-radius: 0px;
    border-top-right-radius: 0px;
  }
  .el-button{
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
}

</style>
