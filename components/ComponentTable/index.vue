<template>
  <section :id="id" class="common-section">
    <div class="common-section-header" :data-section="sectionKey">
      <h2>{{ tableConfig.title }}</h2>
    </div>
    <div class="common-section-body">
      <!-- 自定义插槽，可完全自定义内容区域 -->
      <slot name="custom-content" :tableData="tableData" :columns="columns" :loading="loading" />
      <!-- 默认表格内容 -->
      <div v-if="!$slots['custom-content']" class="common-section-table">
        <div class="component-table">
          <vxe-table
            ref="table"
            :data="tableData"
            stripe
            resizable
            border="inner"
            size="medium"
            show-overflow
            :checkbox-config="{ checkField: 'checked' }"
          >
            <vxe-column
              v-for="column in columns"
              :key="column.field || column.title"
              :field="column.field"
              :title="column.title"
              :width="column.width"
              :align="column.align || 'center'"
              :fixed="column.fixed"
            >
              <template v-slot:default="slotData">
                <slot v-if="column.slots?.default" :name="column.slots.default" v-bind="slotData" />
                <span v-else>{{ slotData.row[column.field] }}</span>
              </template>
            </vxe-column>
          </vxe-table>

          <!-- 分页组件 -->
          <div v-if="showPagination" :style="{ textAlign: paginationAlign }">
            <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              :current-page="currentPage"
              :page-sizes="pageSizes"
              :page-size="pageSize"
              :layout="paginationLayout"
              :total="total"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  name: 'ComponentTable',
  props: {
    id: {
      type: String,
      default: ''
    },
    tableConfig: {
      type: Object,
      default: () => {}
    },
    // API方法，接收参数并返回Promise
    apiMethod: {
      type: Function,
      default: null
    },
    columns: {
      type: Array,
      default: () => []
    },
    // 控制是否显示分页
    showPagination: {
      type: Boolean,
      default: true
    },
    // 额外的参数对象
    extraParams: {
      type: Object,
      default: () => ({})
    },
    // 分页相关配置
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    paginationLayout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    paginationAlign: {
      type: String,
      default: 'left'
    },
    // 外部传入的数据
    tableDataExternal: {
      type: Array,
      default: null
    },
    // section 标识
    sectionKey: {
      type: String,
      default: ''
    },
    // 是否延迟加载，设置为 true 时初始化不查询，只有 extraParams 变化或手动调用 refresh() 时才查询
    lazy: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      internalTableData: [],
      total: 0,
      loading: false,
      currentPage: 1,
      pageSize: 10
    };
  },
  computed: {
    // 计算属性：外部传入数据时返回分页后的内部数据，否则使用内部数据
    tableData () {
      // 外部传入数据时，internalTableData 已经是分页后的数据
      if (this.tableDataExternal !== null && this.tableDataExternal !== undefined) {
        return this.internalTableData;
      }
      return this.internalTableData;
    }
  },
  watch: {
    // 监听额外参数变化，重新加载数据
    extraParams: {
      handler (newVal, oldVal) {
        // 只有当没有外部传入数据时才重新加载
        if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
          // 比较新旧参数值是否真的变化了，避免父组件重新渲染导致的不必要调用
          const newStr = JSON.stringify(newVal || {});
          const oldStr = JSON.stringify(oldVal || {});
          if (newStr !== oldStr) {
            this.loadData();
          }
        }
      },
      deep: true
    },
    // 监听API方法变化，当API方法改变时重新加载数据
    apiMethod () {
      if (this.apiMethod && (this.tableDataExternal === null || this.tableDataExternal === undefined)) {
        this.loadData();
      }
    },
    // 监听外部传入的数据变化
    tableDataExternal: {
      handler (newVal) {
        if (newVal !== null && newVal !== undefined) {
          // 当外部传入新数据时，更新内部数据
          this.internalTableData = newVal;
          // 外部传入全量数据时，total 直接用数据长度
          this.total = newVal.length;
        }
      },
      // 移除 deep: true，避免数组内对象属性变化时触发 watch
      // 外部传入新数组引用时仍会触发更新
      immediate: true
    },
  },
  created () {
    // 如果有外部数据则使用外部数据进行前端分页，否则加载内部数据
    if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
      if (this.apiMethod && !this.lazy) {
        this.loadData();
      }
    } else {
      // 外部传入全量数据时，前端分页处理
      this.loadData();
    }
  },
  // mounted () {},
  methods: {
    // 加载数据
    async loadData () {
      // 外部传入数据时，前端分页处理
      if (this.tableDataExternal !== null && this.tableDataExternal !== undefined) {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.internalTableData = this.tableDataExternal.slice(start, end);
        return;
      }

      // 如果没有API方法，则不执行加载
      if (!this.apiMethod) {
        return;
      }

      // lazy 模式下，检查 extraParams 中的 retailOrderCode 是否有有效值
      if (this.lazy) {
        const retailOrderCode = this.extraParams?.retailOrderCode;
        if (!retailOrderCode) {
          return;
        }
      }

      this.loading = true;
      try {
        const params = {
          pageNum: this.currentPage,
          pageSize: this.pageSize,
          ...this.extraParams
        };

        const response = await this.apiMethod(params);
        const dataList = response.data || response.records || response || [];
        this.internalTableData = dataList;
        this.total = response.totals || response.count || 0;
      } catch (error) {
        this.internalTableData = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },
    // 获取选中的行数据
    getSelection () {
      return this.$refs.table ? this.$refs.table.getCheckboxRecords() : [];
    },
    // 清除选中状态
    clearSelection () {
      if (this.$refs.table) {
        this.$refs.table.clearCheckboxRow();
        this.$refs.table.clearCheckboxReserve();
      }
    },
    // 处理每页数量变化
    handleSizeChange (val) {
      this.pageSize = val;
      this.currentPage = 1; // 重置到第一页
      // 只有当没有外部传入数据时才重新加载
      if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
        this.loadData();
      } else {
        // 外部传入全量数据，前端分页处理
        this.loadData();
      }
    },
    // 处理当前页变化
    handleCurrentChange (val) {
      this.currentPage = val;
      // 只有当没有外部传入数据时才重新加载
      if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
        this.loadData();
      } else {
        // 外部传入全量数据，前端分页处理
        this.loadData();
      }
    },
    // 刷新数据的方法，供外部调用
    refresh () {
      // 只有当没有外部传入数据时才重新加载
      if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
        this.loadData();
      }
    },
    // 供外部设置当前页的方法
    setCurrentPage (page) {
      this.currentPage = page;
      // 只有当没有外部传入数据时才重新加载
      if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
        this.loadData();
      }
    },
    // 供外部设置页面大小的方法
    setPageSize (size) {
      this.pageSize = size;
      // 只有当没有外部传入数据时才重新加载
      if (this.tableDataExternal === null || this.tableDataExternal === undefined) {
        this.loadData();
      }
    },
    // 获取内部数据的方法（用于外部访问）
    getInternalData () {
      return this.internalTableData;
    }
  }
};
</script>

<style scoped lang="scss">
/* .component-table {
  position: relative;
} */
</style>
