<template>
  <div v-if="$store.state.menu" class="page-title-wrapper">
    <el-breadcrumb separator="/"  class="pageTitle">
      <i v-if="list.length > 1" class="icon-back el-icon-arrow-left" @click="handleBack"></i>
      <el-breadcrumb-item v-for="(item,index) in list" :key="index">
        <span @click="handleClick(index)" :class="index===list.length-1?'breadTail':'breadLink'">{{item}}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>
    <el-alert v-if="isPre" class="pageTips" title="本环境仅用于测试培训" type="warning" :closable="false">
  </el-alert>
  </div>
</template>

<script>

export default {
  data () {
    return {
      isPre: window.APP_AIS_WEB_CONFIG?.ENV === 'pre'
    };
  },
  computed: {
    list () {
      return this.$store?.state?.menu?.activeBreadcrumb || [];
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
  },
  beforeDestroy () {
    this.$store.commit('SET_ACTIVE_BREADCRUMB', []);
    document.title = '零小跑-零跑汽车';
  }
};
</script>

<style lang="scss" scoped>
.page-title-wrapper{
  display: flex;
  justify-content: space-between;
  align-items: center;
  .pageTips{
    color: var(--leap-color-warning);
    font-size: 14px;
    margin-right: 20px;
    width: 180px;
  }
}
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
  ::v-deep .el-breadcrumb__separator{
    margin: 0 4px;
    font-weight: 400;
  }
}
</style>
