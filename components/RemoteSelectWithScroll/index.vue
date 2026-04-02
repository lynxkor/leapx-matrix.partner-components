<script>
/**
 * 支持远程搜索和滚动加载的下拉选择组件
 * 基于 FetchSelect 扩展，增加了滚动加载更多功能
 *
 * @param {Function} remoteMethod - 远程搜索方法，接收 (query, pageNum, pageSize) 参数
 * @param {Number} pageSize - 每次加载的数据量，默认 100
 * @param {Boolean} multiple - 是否多选
 * @param {String} valueKey - 值字段名
 * @param {String} labelKey - 标签字段名
 */
</script>
<template>
  <el-select
    v-bind="$attrs"
    :value="showValue"
    @input="handleInput"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @clear="handleClear"
    :loading="false"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.7)"
    filterable
    collapse-tags
    :remote="true"
    :remote-method="searchMethod"
    popper-class="ais-remote-select-with-scroll"
    ref="selectRef"
    :multiple="multiple"
  >
    <el-option
      v-for="item in options"
      :key="item[valueKey]"
      :label="item[labelKey]"
      :value="item[valueKey]"
      :disabled="item.disabled"
    >
      <template v-if="subLabelKey">
        <div>{{ item[labelKey] }}</div>
        <div class="el-select-sub-text">{{ item[subLabelKey] }}</div>
      </template>
    </el-option>

    <!-- 加载更多提示（静默加载，不显示） -->
    <!-- <div v-if="loading && options.length > 0" class="scroll-loading-tip">
      <i class="el-icon-loading"></i> 加载中...
    </div> -->

    <!-- 没有更多数据提示 -->
    <div v-if="!hasMore && options.length > 0" class="no-more-tip">
      没有更多数据了
    </div>
  </el-select>
</template>

<script>
export default {
  name: 'RemoteSelectWithScroll',
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      default: null
    },
    // 远程搜索方法，接收 (query, pageNum, pageSize) 参数
    remoteMethod: {
      type: Function,
      required: true
    },
    // 每页数量
    pageSize: {
      type: Number,
      default: 100
    },
    // 值字段名
    valueKey: {
      type: String,
      default: 'code'
    },
    // 标签字段名
    labelKey: {
      type: String,
      default: 'message'
    },
    // 子标签字段名
    subLabelKey: {
      type: String,
      default: null
    },
    // 是否多选
    multiple: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      options: [],
      loading: false,
      showValue: this.value,
      currentPage: 1,
      hasMore: true,
      searchQuery: '',
      popperElement: null,
      isInitialLoad: false,
      selectedMap: new Map() // 已选中的选项映射（用于多选模式）
    };
  },
  watch: {
    value: {
      handler (val) {
        if (Object.prototype.toString.call(val) === '[object Number]') {
          this.showValue = String(val);
        } else {
          this.showValue = val;
        }

        // 多选模式下，保存已选中的值
        if (Array.isArray(val)) {
          val.forEach(v => {
            const key = String(v);
            if (!this.selectedMap.has(key)) {
              // 如果选项不在已加载的列表中，创建一个临时选项
              const existingOption = this.options.find(opt => String(opt[this.valueKey]) === key);
              if (!existingOption) {
                this.selectedMap.set(key, { [this.valueKey]: v, [this.labelKey]: v });
              }
            }
          });
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initScrollListener();
    });
  },
  methods: {
    // 搜索方法（包装器）
    searchMethod (query) {
      this.searchQuery = query || '';
      this.currentPage = 1;
      this.hasMore = true;
      // 多选模式下保留已选中的选项
      if (Array.isArray(this.value) && this.value.length > 0) {
        const selectedValues = new Set(this.value.map(v => String(v)));
        this.options = this.options.filter(opt => selectedValues.has(String(opt[this.valueKey])));
      } else {
        this.options = [];
      }
      this.loadData(this.searchQuery, false);
    },

    // 加载数据
    async loadData (query, isScrollLoad = false) {
      if (!this.hasMore || this.loading) {
        return;
      }

      this.loading = true;

      try {
        const response = await this.remoteMethod(query, this.currentPage, this.pageSize);
        if (!response) {
          this.loading = false;
          return;
        }

        // 根据实际响应结构处理数据
        // 响应结构：{ code, data: { records, pageNum, pageSize, total, totalPage }, msg }
        const responseData = response.data || response;
        const records = responseData.records || response.records || response.data || response || [];
        const total = responseData.total || response.total || 0;
        const totalPage = responseData.totalPage || response.totalPage || 0;

        const formatedData = records.map(item => {
          const formatted = { ...item };
          // 强制统一使用 string
          if (Object.prototype.toString.call(formatted[this.valueKey]) === '[object Number]') {
            formatted[this.valueKey] = String(formatted[this.valueKey]);
          }
          return formatted;
        });

        // 更新已选中映射
        formatedData.forEach(item => {
          this.selectedMap.set(String(item[this.valueKey]), item);
        });

        // 如果是滚动加载，追加数据；否则替换数据
        if (isScrollLoad) {
          this.options = [...this.options, ...formatedData];
        } else {
          // 首次加载或搜索时，保留已选中的选项
          const selectedValues = Array.isArray(this.value)
            ? new Set(this.value.map(v => String(v)))
            : new Set([String(this.value)]);
          const selectedOptions = this.options.filter(opt => selectedValues.has(String(opt[this.valueKey])));
          this.options = [...selectedOptions, ...formatedData];
        }

        // 判断是否还有更多数据：当前页码小于总页数说明还有更多
        this.hasMore = this.currentPage < totalPage;
        this.currentPage++;

      } catch (error) {
        console.error('Failed to load options:', error);
        this.options = [];
        this.hasMore = false;
      } finally {
        this.loading = false;
      }
    },

    // 初始化滚动监听
    initScrollListener () {
      const popperElement = document.querySelector('.ais-remote-select-with-scroll .el-select-dropdown__wrap');
      if (popperElement) {
        this.popperElement = popperElement;
        popperElement.addEventListener('scroll', this.handleScroll);
      }
    },

    // 处理滚动事件
    handleScroll () {
      if (!this.popperElement || this.loading || !this.hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = this.popperElement;
      // 当滚动到距离底部 50px 时加载更多
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        this.loadData(this.searchQuery, true);
      }
    },

    // 处理输入事件
    handleInput (val) {
      if (val && val.length === 0) {
        this.$emit('input', '');
      } else {
        this.$emit('input', val);
      }
    },

    // 处理值变更事件
    handleChange (val) {
      let selectedOption;
      if (Array.isArray(val)) {
        selectedOption = val.map(v =>
          this.options.find(option => String(option[this.valueKey]) === String(v))
        ).filter(Boolean);
      } else {
        selectedOption = this.options.find(
          option => String(option[this.valueKey]) === String(val)
        );
      }
      this.$emit('change', val, selectedOption);
    },

    handleBlur () {
      this.$emit('blur');
    },

    handleFocus (e) {
      if (!this.isInitialLoad && this.options.length === 0) {
        this.isInitialLoad = true;
        this.loadData('', false);
      }
      this.$emit('focus', e.target.value);
    },

    handleClear () {
      this.currentPage = 1;
      this.hasMore = true;
      this.searchQuery = '';
      this.selectedMap.clear();
      this.options = [];
      this.loadData('', false);
    },

    // 手动刷新
    refresh () {
      this.currentPage = 1;
      this.hasMore = true;
      this.loadData(this.searchQuery, false);
    }
  },
  beforeDestroy () {
    if (this.popperElement) {
      this.popperElement.removeEventListener('scroll', this.handleScroll);
    }
  }
};
</script>

<style scoped lang="scss">
.ais-remote-select-with-scroll {
  width: 100%;

  .el-select-dropdown__item {
    height: auto;
    position: relative;
    &.selected::after {
      top: 0;
    }
  }

  .el-select-sub-text {
    font-size: 12px;
    color: var(--leap-color-default-light-2);
    line-height: 1;
    margin-bottom: 8px;
  }

  .scroll-loading-tip {
    padding: 8px 16px;
    text-align: center;
    color: #909399;
    font-size: 12px;

    i {
      margin-right: 4px;
    }
  }

  .no-more-tip {
    padding: 8px 16px;
    text-align: center;
    color: #C0C4CC;
    font-size: 12px;
  }
}

::v-deep .el-select__tags {
  flex-wrap: nowrap;
}
</style>
