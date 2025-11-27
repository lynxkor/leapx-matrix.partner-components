// mixins/routeGuard.js
export default {
  beforeRouteLeave (to, from, next) {
    if (JSON.stringify(this.form) === JSON.stringify(this.originalForm)) {
      next();
    } else {
      const message = '<div class="ais-leave-tips-main"><i class="iconfont icon-lxppc-prompt"></i>确定要离开当前页面吗？</div><div class="ais-leave-tips-sub">离开后，当前编辑数据会被清空。</div>';
      this.$confirm(message, '', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        customClass: 'ais-leave-tips',
        showClose: false
      }).then(() => {
        next();
      }).catch(() => {
        next(false);
      });
    }
  },
};
