<template>
  <div v-if="$store.state.menu">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item,index) in $store.state.menu.activeBreadcrumb" :key="index">
        <span :class="index===$store.state.menu.activeBreadcrumb.length-1?'breadTail':''">{{item}}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>
    <div class="pageTitle">{{ $store.state.menu.activeBreadcrumb[$store.state.menu.activeBreadcrumb.length-1] }}</div>
  </div>
</template>

<script>
export default {
  created () {
    // console.log(this.$store.state.menu.activeBreadcrumb, '333333');
  }
};
</script>

<style lang="scss" scoped>
.el-breadcrumb {
  /* line-height: inherit!important; */
  border-radius: .6rem;
  padding-left: 0rem;
  font-size: 1.4rem;
  padding-top: 24px;
  padding-bottom: 19px;
  line-height: 19px;
}

.el-breadcrumb__separator {
  color: #7A837B;
}

::v-deep .el-breadcrumb__inner {
    color: #7A837B;
}

::v-deep .el-breadcrumb__item:last-child .el-breadcrumb__inner {
  color: #000;
}

.pageTitle {
  font-size: 29px;
  color: #000;
}
</style>
