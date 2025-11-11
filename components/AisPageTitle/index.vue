<template>
  <div v-if="$store.state.menu">
    <el-breadcrumb separator="/"  class="pageTitle">
      <i v-if="list.length > 1" class="icon-back el-icon-arrow-left" @click="handleBack"></i>
      <el-breadcrumb-item v-for="(item,index) in list" :key="index" :to="index === 0 ? {path: parentPath} : null">
        <span :class="index===list.length-1?'breadTail':''">{{item}}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>
export default {
  computed: {
    list () {
      return this.$store.state.menu.activeBreadcrumb || [];
    },
    parentPath () {
      return this.$route.path.split('/').slice(0, -1).join('/');
    }
  },
  methods: {
    handleBack () {
      this.$router.back();
    }
  }
};
</script>

<style lang="scss" scoped>
::v-deep .el-breadcrumb__inner {
    color: #6C6E6C;
    font-weight: normal;
}
.pageTitle {
  font-size: 16px;
  font-weight: 600;
  color: #3B3E3B;
  height: 100%;
  line-height: 56px;
  .icon-back {
    cursor: pointer;
    margin-right: 10px;
    float: left;
    line-height: 56px;
  }
}
</style>
