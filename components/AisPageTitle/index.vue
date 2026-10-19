<template>
  <div v-if="$store.state.menu" class="page-title-wrapper">
    <div class="page-title-wrapper-left">
      <el-breadcrumb separator="/"  class="pageTitle">
        <i v-if="list.length > 1" class="icon-back el-icon-arrow-left" @click="handleBack"></i>
        <el-breadcrumb-item v-for="(item,index) in list" :key="index">
          <span @click="handleClick(index)" :class="index===list.length-1?'breadTail':'breadLink'">{{item}}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
      <CustomView
        v-if="canCustomView"
        :value="conditions"
        :sort-columns="sortColumns"
        :active-preset-id="activePresetId"
        :biz-key="bizKey"
        class="page-title-wrapper__cv"
        @input="val => patch({ conditions: val })"
        @update:sortColumns="val => patch({ sortColumns: val })"
        @update:activePresetId="val => patch({ activePresetId: val })"
        @refresh="onRefresh"
      />
    </div>
    <el-alert v-if="isPre" class="pageTips" title="本环境仅用于测试培训" type="error" :closable="false">
  </el-alert>
  </div>
</template>

<script>
import CustomView from '@/libs/components/CustomView/index.vue';
import { isCustomViewTab } from '@/libs/store/customView';

export default {
  components: { CustomView },
  data () {
    return {
      isPre: window.APP_AIS_WEB_CONFIG?.ENV === 'pre'
    };
  },
  computed: {
    cv () {
      // 直读「当前路由 meta 的桶」:bizKey 依赖 $route,响应式天然成立,
      // 不经过任何全局当前态,规避微前端销毁重建时的写读桶错位
      return this.$store.state.customView.cache[this.bizKey] ||
        { activePresetId: null, conditions: null, sortColumns: [], refreshTick: 0, currentTab: '' };
    },
    conditions () {
      return this.cv.conditions;
    },
    sortColumns () {
      return this.cv.sortColumns;
    },
    activePresetId () {
      return this.cv.activePresetId;
    },
    list () {
      return this.$store?.state?.menu?.activeBreadcrumb || [];
    },
    bizKey () {
      return this.$route?.meta?.customViewBizKey || '';
    },
    resourceTag () {
      return this.$route?.meta?.customViewResourceTag || '';
    },
    canCustomView () {
      // 默认隐藏:仅当路由配置了 customViewResourceTag 且用户拥有该权限时显示
      if (!this.bizKey || !this.resourceTag) return false;
      // 页签约束(需求 LP262042 7.1.2.2):本组件在全局 layout 里、业务页之上,
      // 拿不到业务页内部的页签状态,只能读业务页回写到 store 的 currentTab。
      // 业务页尚未回写时(首屏)先放行,避免视图入口闪烁或整段不显示。
      const tab = this.cv.currentTab;
      if (tab && !isCustomViewTab(tab)) return false;
      return (this.$store.state.pageSource?.aisPageSource || []).includes(this.resourceTag);
    }
  },
  methods: {
    patch (payload) {
      this.$store.commit('customView/PATCH_VIEW', { ...payload, bizKey: this.bizKey });
    },
    onRefresh () {
      this.$store.commit('customView/REFRESH_VIEW', this.bizKey);
    },
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
    color: var(--leap-color-danger);
    margin-right: 20px;
    width: 250px;
    text-align: center;
    ::v-deep .el-alert__title {
      font-size: 18px;
    }
  }
  &-left {
    display: flex;
    align-items: center;
  }
  .el-divider--vertical {
    height: 20px;
  }
  &__cv {
    margin-left: 16px;
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
