import { executeQuery } from '@/api/datareport/customQueryView';

/**
 * 自定义视图(customView)列表页接入 mixin —— store 桥接模式。
 *
 * CustomView 触发器已提升到全局 AisPageTitle，选中态存于
 * @/libs/store/customView。本 mixin 只读取 store 的 activePresetId
 * 来驱动业务页取数与表单锁定。
 *
 * 业务页用法:
 *   1. mixins 数组追加 customViewMixin;
 *   2. 业务页的统一取数方法 getData() 顶部加一行:
 *        if (this.fetchByCustomView()) return;
 *   3. onReset 里调 this.resetCustomView() 清视图状态;
 *   4. (可选)覆盖 customViewListAdapter(records) 给表格行加业务标志(如 deleteLoading)。
 *   5. 路由 meta.customViewBizKey 配置 bizKey,AisPageTitle 据此渲染 CustomView。
 *
 * 契约(务必遵守):
 *   - 业务页取数入口必须继续叫 getData 且不可改名:commonMixins 的 activated()
 *     在 keep-alive 激活时会调 this.getData?.(),改名会导致从详情页返回列表时
 *     表格不刷新(视图锁定态下尤其隐蔽)。
 *   - 业务页须自行持有以下 data 字段(mixin 只读写不持有):
 *       tableForm: { page, size }、tableDataList、tableTotal、loading
 *
 * 设计要点:mixin 不覆盖业务页 getData,只提供布尔钩子 fetchByCustomView()。
 * 视图锁定(store 中有 activePresetId)时由 mixin 走 executeQuery;否则返回 false,
 * 交回业务页 getData 走原有列表接口,可断点、可读、零魔法。
 * store.activePresetId 变化由 watch 接管,触发 onViewChange 完成选中/清空分流。
 */
export default {
  computed: {
    activePresetId () {
      return this.$store.state.customView.activePresetId;
    },
    formDisabled () {
      return !!this.activePresetId;
    }
  },
  watch: {
    /**
     * CustomView 现位于 AisPageTitle,选中/清空通过 store 反映到此。
     * onViewChange 内部已按 activePresetId 有无分流,无需区分原因。
     */
    activePresetId () {
      this.onViewChange();
    }
  },
  methods: {
    /**
     * 视图取数钩子。在业务页 getData() 顶部调用:
     *   if (this.fetchByCustomView()) return;
     * 无选中视图返回 false(交回业务页);有则走 executeQuery 并返回 true。
     * @returns {Boolean}
     */
    fetchByCustomView () {
      if (!this.activePresetId) return false;
      this.loading = true;
      this.getCustomViewData();
      return true;
    },
    getCustomViewData () {
      return executeQuery({
        viewId: this.activePresetId,
        pageNum: this.tableForm.page,
        pageSize: this.tableForm.size
      }).then(res => {
        const records = (res && res.records) || [];
        this.tableDataList = this.customViewListAdapter(records);
        this.tableTotal = res ? res.total : 0;
      }).finally(() => {
        this.loading = false;
      });
    },
    onViewChange () {
      // store 中 activePresetId 有值走 executeQuery,清空则回业务列表查询
      if (this.activePresetId) {
        this.loading = true;
        this.getCustomViewData();
      } else {
        this.getData();
      }
    },
    /**
     * 视图取数结果 → 表格行的映射。默认原样返回,业务页按需覆盖
     * (如注入 deleteLoading 等行级标志)。
     * @param {Array} records
     * @returns {Array}
     */
    customViewListAdapter (records) {
      return records || [];
    },
    resetCustomView () {
      this.$store.commit('customView/RESET_CUSTOM_VIEW');
    }
  }
};
