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
        v-bind="viewStandardProps"
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
      <GenericView
        v-if="canGenericView"
        :key="pqvTableCode"
        :table-code="pqvTableCode"
        class="page-title-wrapper__gv"
      />
    </div>
    <el-alert v-if="isPre" class="pageTips" title="本环境仅用于测试培训" type="error" :closable="false">
  </el-alert>
  </div>
</template>

<script>
import CustomView from '@/libs/components/CustomView/index.vue';
import GenericView from '@/libs/components/GenericView/index.vue';
import { standardViewOptions } from '@/libs/components/CustomView/viewConfig';
import {
  state as personalQueryViewState,
  resolveTableCode,
  scopeCode,
  isEnabled,
  clearSelection
} from '@/libs/store/personalQueryView';

export default {
  components: { CustomView, GenericView },
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
        { activePresetId: null, conditions: null, sortColumns: [], refreshTick: 0 };
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
      return (this.$store.state.pageSource?.aisPageSource || []).includes(this.resourceTag);
    },
    /**
     * 标准个人视图配置:与业务页内联的 CustomView 共用 lib 同一份出口,
     * 避免「全局标题栏一套 props、页面内联另一套」看起来像两个组件。
     *
     * <p><b>全局只有一套样式</b>:不再由路由 meta 的开关决定走哪一套 ——
     * 所有接了个人视图的页面,下拉文案 / 角标 / 复制 / 设为默认完全一致。
     * 标题栏拿不到页面级表格列定义,故不传 columns —— 弹窗仍是
     * 「条件 + 排序」形态(批量排序能力已内置,与页面内联实例完全一致)。</p>
     */
    viewStandardProps () {
      return standardViewOptions({ localApply: false });
    },
    pqvTableCode () {
      // 标题栏在业务页之上拿不到页面内部 tab 状态,读搜索栏回写的 activeScope
      // 拼出完整桶键;scope 变化时此处响应式重算,GenericView 随 :key 重建换列表
      const base = resolveTableCode(this.$route);
      const bucket = personalQueryViewState.cache[base];
      return scopeCode(base, bucket ? bucket.activeScope : '');
    },
    canGenericView () {
      // 路由 meta.personalQueryView === false 时对该页面关闭
      if (!isEnabled(this.$route)) return false;
      // 只有当前路由真正渲染了列表搜索栏(AisPageSearchAction 登记过)才显示
      const bucket = personalQueryViewState.cache[this.pqvTableCode];
      return !!(bucket && bucket.registered > 0);
    }
  },
  watch: {
    // 两个视图入口互斥:选中高级自定义视图时清掉通用视图选中态
    activePresetId (val) {
      if (val) clearSelection(this.pqvTableCode);
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
  &__gv {
    margin-left: 8px;
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
