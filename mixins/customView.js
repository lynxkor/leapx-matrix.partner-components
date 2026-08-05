import { executeQuery } from '@/api/datareport/customQueryView';

/**
 * 自定义视图(customView)列表页接入 mixin —— store 桥接模式。
 *
 * CustomView 触发器已提升到全局 AisPageTitle,选中态存于
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
 *
 * 字段适配(默认适配常见命名,字段不同时覆盖对应钩子即可,无需改 mixin):
 *   - 分页对象:  _cvPager()         默认返回 this.optionObj.form({ page, size })
 *   - 结果回填:  _cvSetResult(records, total)  默认写 this.optionObj.dataList / this.optionObj.total
 *   - 加载态:    _cvSetLoading(val) 默认写 this.loading
 *   说明: 分页保持「单一来源」——mixin 直接读写业务页自己的分页对象,
 *         切换/清除视图时把 page 重置为 1,翻页仍走业务页原有的分页事件,
 *         避免双分页源不同步。
 *
 * 设计要点:mixin 不覆盖业务页 getData,只提供布尔钩子 fetchByCustomView()。
 * 视图锁定(store 中有 activePresetId)时由 mixin 走 executeQuery;否则返回 false,
 * 交回业务页 getData 走原有列表接口,可断点、可读、零魔法。
 * store.activePresetId 变化由 watch 接管,触发 onViewChange 完成选中/清空分流。
 */
export default {
  created () {
    // 组件创建时锁定自己的 bizKey。被 keep-alive 缓存后 this.$route 会变成
    // 全局当前路由,无法再用 $route.meta 区分,故必须创建时记下。
    this._customViewBizKey = this.$route?.meta?.customViewBizKey || '';
  },
  computed: {
    activePresetId () {
      // 始终读「自己的桶」cache[bizKey],与全局 store.bizKey 解耦:
      // 切到别的路由时本页 activePresetId 不变,watcher 不会对不可见页触发,
      // 从而避免幽灵请求,无需 _isInactive 守卫。
      const bucket = this.$store.state.customView.cache[this._customViewBizKey];
      return bucket ? bucket.activePresetId : null;
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
    // ---- 字段适配钩子(默认适配常见命名,业务页按需覆盖) ----
    /** 分页对象引用(读写同一份,保持单一来源) */
    _cvPager () {
      return this.optionObj.form;
    },
    /** 视图取数结果回填表格 */
    _cvSetResult (records, total) {
      this.optionObj.dataList = records;
      this.optionObj.total = total;
    },
    /** 加载态开关 */
    _cvSetLoading (val) {
      this.loading = val;
    },
    /**
     * 视图取数钩子。在业务页 getData() 顶部调用:
     *   if (this.fetchByCustomView()) return;
     * 无选中视图返回 false(交回业务页);有则走 executeQuery 并返回 true。
     * @returns {Boolean}
     */
    fetchByCustomView () {
      if (!this.activePresetId) return false;
      this._cvSetLoading(true);
      this.getCustomViewData();
      return true;
    },
    getCustomViewData () {
      const pager = this._cvPager();
      return executeQuery({
        viewId: this.activePresetId,
        pageNum: pager.page,
        pageSize: pager.size
      }).then(res => {
        const records = (res && res.records) || [];
        this._cvSetResult(this.customViewListAdapter(records), res ? res.total : 0);
      }).finally(() => {
        this._cvSetLoading(false);
      });
    },
    onViewChange () {
      // 切换/清除视图都应回到第 1 页,避免停留在超出新结果集的页码
      this._cvPager().page = 1;
      // store 中 activePresetId 有值走 executeQuery,清空则回业务列表查询
      if (this.activePresetId) {
        this._cvSetLoading(true);
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
      this.$store.commit('customView/RESET_VIEW');
    }
  }
};
