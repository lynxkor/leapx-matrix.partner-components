import { executeQuery } from '@/api/datareport/customQueryView';

/**
 * 自定义视图(customView)列表页接入 mixin —— hook-only 模式。
 *
 * 业务页用法:
 *   1. mixins 数组追加 customViewMixin;
 *   2. 模板用 <CustomView v-model="appliedCustomConditions"
 *        :sort-columns.sync="sortColumns" :active-preset-id.sync="activePresetId"
 *        :biz-key="xxx" @change="onViewChange" />;
 *   3. 业务页的统一取数方法 getData() 顶部加一行:
 *        if (this.fetchByCustomView()) return;
 *   4. onReset 里调 this.resetCustomView() 清视图状态;
 *   5. (可选)覆盖 customViewListAdapter(records) 给表格行加业务标志(如 deleteLoading)。
 *
 * 契约(务必遵守):
 *   - 业务页取数入口必须继续叫 getData 且不可改名:commonMixins 的 activated()
 *     在 keep-alive 激活时会调 this.getData?.(),改名会导致从详情页返回列表时
 *     表格不刷新(视图锁定态下尤其隐蔽)。
 *   - 业务页须自行持有以下 data 字段(mixin 只读写不持有):
 *       tableForm: { page, size }、tableDataList、tableTotal、loading
 *
 * 设计要点:mixin 不覆盖业务页 getData,只提供布尔钩子 fetchByCustomView()。
 * 视图锁定(有 activePresetId)时由 mixin 走 executeQuery;否则返回 false,
 * 交回业务页 getData 走原有列表接口,可断点、可读、零魔法。
 */
export default {
  data () {
    return {
      activePresetId: null,
      appliedCustomConditions: null,
      sortColumns: []
    };
  },
  computed: {
    formDisabled () {
      return !!this.activePresetId;
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
      // CustomView 触发 change:选中视图走 executeQuery,清空则回业务列表查询
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
      this.appliedCustomConditions = null;
      this.activePresetId = null;
      this.sortColumns = [];
    }
  }
};
