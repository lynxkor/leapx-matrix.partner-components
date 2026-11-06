<template>
  <el-select
    :value="innerValue"
    multiple
    filterable
    clearable
    collapse-tags
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    class="c-rvs"
    popper-class="ais-el-select"
    @input="onInput"
  >
    <el-option
      v-for="opt in displayOptions"
      :key="opt.code"
      :label="opt.name"
      :value="opt.code"
    />
  </el-select>
</template>

<script>
import { loadRelationDimensionOptions } from './relationMeta';

/**
 * 关联对象的维度候选值多选框。
 *
 * 关联字段（如「门店编码」关联门店的大区）的筛选值不是字段自身的值，
 * 而是关联对象某个维度上的取值 —— 这里按维度给出候选值让用户勾选，
 * 不让用户手打，避免手打值与维度对不上导致查不到数据。
 *
 * 存编码（code）、展示名称（name）：区县重名时名称会串，编码唯一，
 * 且后端匹配用的就是编码。
 *
 * 样式与列表页的门店筛选一致（el-select 多选 + 可搜索 + 标签折叠）。
 */
export default {
  name: 'RelationValueSelect',
  props: {
    /** 已选中的编码数组 */
    value: {
      type: Array,
      default: () => []
    },
    /** 维度：province / city / district / region / serviceStatusName */
    column: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    }
  },
  data () {
    return {
      options: [],
      loading: false
    };
  },
  computed: {
    innerValue () {
      return Array.isArray(this.value) ? this.value : [];
    },
    displayOptions () {
      // 选中的值不在候选值里时（历史数据 / 维度值被停用）补一个兜底项，
      // 否则 el-select 会显示成空白，用户看不出原来选了什么。
      const known = new Set(this.options.map(item => String(item.code)));
      const missing = this.innerValue
        .filter(code => !known.has(String(code)))
        .map(code => ({ code, name: code }));
      return [...this.options, ...missing];
    }
  },
  watch: {
    column: {
      immediate: true,
      handler () {
        this.loadOptions();
      }
    }
  },
  methods: {
    async loadOptions () {
      if (!this.column) {
        this.options = [];
        return;
      }
      this.loading = true;
      try {
        this.options = await loadRelationDimensionOptions(this.column);
      } catch (e) {
        this.options = [];
      } finally {
        this.loading = false;
      }
    },
    onInput (val) {
      this.$emit('input', val || []);
    }
  }
};
</script>

<style lang="scss" scoped>
.c-rvs {
  width: 100%;
}
</style>
