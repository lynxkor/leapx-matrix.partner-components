// 公共逻辑预埋
// 后续遇到所有页面改动时，优先考虑添加到该文件
// 页面都注入pageType = 'detail' || 'edit' || 'list'，根据页面类型选择性注入方法
export default {
  activated () {
    // keep-alive 缓存过的页面，激活时重新设置面包屑
    if (this.$route.meta.keepAlive && this.pageTitle) {
      this.$store.commit('SET_ACTIVE_BREADCRUMB', [this.pageTitle]);
      this.getData();
    }
  },
};
