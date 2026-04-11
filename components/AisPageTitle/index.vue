<template>
  <div v-if="$store.state.menu">
    <el-breadcrumb separator="/"  class="pageTitle">
      <i v-if="list.length > 1" class="icon-back el-icon-arrow-left" @click="handleBack"></i>
      <el-breadcrumb-item v-for="(item,index) in list" :key="index">
        <span @click="handleClick(index)" :class="index===list.length-1?'breadTail':'breadLink'">{{item}}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script>

export default {
  computed: {
    list () {
      return this.$store.state.menu.activeBreadcrumb || [];
    }
  },
  methods: {
    handleClick (index) {
      if (index === this.list.length - 1) {
        return;
      }
      const path = this.$route.path.split('/').slice(0, -1).join('/');
      const router_base = window.APP_AIS_WEB_CONFIG?.VUE_APP_ROUTER_BASE || process.env.VUE_APP_ROUTER_BASE;
      if (window.__POWERED_BY_QIANKUN__) {
        if (window.__PARENT_ROUTER__) {
          window.__PARENT_ROUTER__.push({
            path: `${router_base}${path}`
          });
        } else {
          window.location.href = `${router_base}${path}`;
        }
      } else {
        this.$router.push({
          path
        });
      }
    },
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
  height: 56px!important;
  font-size: 16px;
  font-weight: 500!important;
  color: #3B3E3B;
  height: 100%;
  line-height: 56px;
  .icon-back {
    cursor: pointer;
    margin-right: 10px;
    float: left;
    line-height: 56px;
  }
  .breadLink {
    cursor: pointer;
    &:hover {
      color: var(--themColor);
      text-decoration: underline;
    }
  }
  .breadTail{
    cursor: default;
  }
}
</style>
