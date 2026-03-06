<template>
  <div class="fetch-box">
    <i class="iconfont icon-lxppc-search"></i>
    <slot></slot>
    <span class="suffix">添加</span>
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
  position: relative;
  width: 345px;
  .icon-lxppc-search{
    position: absolute;
    z-index: 1;
    font-size: 16px;
    left: 8px;
    top: 8px;
    color: #9D9F9D;
  }
  .suffix{
    position: absolute;
    z-index: 1;
    right: 0px;
    top: 6px;
    line-height: 19px;
    font-size: 14px;
    color: #3B3E3B;
    width: 48px;
    text-align: center;
    border-left: 1px solid #E6E6E5;
  }

  ::v-deep .el-input__inner{
    padding-left: 28px;
    padding-right: 78px;
  }
  ::v-deep .el-input__suffix {
    right: 53px;
  }
  ::v-deep .el-input{
    .el-input__suffix-inner{
      height: 100%;
      display: flex;
      align-items: center;
    }
    .el-select__caret{
      height: 20px;
      line-height: 20px;
    }
  }

  .el-button{
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
  }
}

</style>
