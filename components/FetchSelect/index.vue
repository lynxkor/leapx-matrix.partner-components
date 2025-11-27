<script>
/**
 * 带自动加载枚举选项的下拉框组件
 * @author wangtao
 * @description 支持静态选项、动态API请求、枚举数据三种数据源方式，具备自动加载、枚举缓存、参数监听、加载状态显示等特性
 *
 * @param {String|Number|Boolean|Object|Array} value - v-model绑定的值
 * @param {Function} request - 获取选项数据的API请求方法，返回Promise
 * @param {String} enumCode - 枚举类型代码，用于从Vuex store中获取预定义的枚举数据
 * @param {Object} params - 请求参数对象，变化时会自动重新加载数据
 * @param {String} valueKey - 选项数据中作为值的键名，默认'code'
 * @param {String} labelKey - 选项数据中作为标签的键名，默认'message'
 * @param {Array} options - 直接传入的静态选项数据，优先级最高
 * @param {Array} filterable - 是否可搜索
 *
 * @event $attrs - 绑定所有父组件的属性到子组件的select元素上
 * @event input - 值变化时触发，用于v-model双向绑定
 * @event change - 值变化时触发，返回选中的值和完整的选项对象
 * @event blur - 失去焦点时触发
 *
 * @example
 *  使用静态选项
 * <fetch-select
 *   v-model="form.gender"
 *   :options="[{ code: '1', message: '男' }, { code: '2', message: '女' }]"
 * />
 *
 * @example
 * 使用API请求
 * <fetch-select
 *   v-model="form.city"
 *   :request="getCityList"
 *   :params="{ type: 'province' }"
 *   value-key="areaCode"
 *   label-key="areaName"
 * />
 *
 * @example
 * 使用枚举数据
 * <fetch-select
 *   v-model="form.status"
 *   enumCode="StatusEnum"
 * />
 */
</script>
<!-- 带自动加载枚举选项的下拉框 -->
<template>
  <el-select
    v-bind="$attrs"
    :value="showValue"
    @input="handleInput"
    @change="handleChange"
    @blur="handleBlur"
    :loading="loading"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.7)"
    :filterable="filterable"
  >
    <el-option
      v-for="item in computedOptions"
      :key="item[valueKey]"
      :label="item[labelKey]"
      :value="item[valueKey]"
      :disabled="item.disabled"
    >
    </el-option>
  </el-select>
</template>

<script>
export default {
  name: 'FormSelect',
  props: {
    // v-model绑定的值
    value: {
      type: [String, Number, Boolean, Object, Array],
      default: null
    },
    // 获取选项数据的请求方法
    // () => Promise.resolve([])
    request: {
      type: Function,
      default: null
    },
    // 枚举key值
    enumCode: {
      type: String,
      default: ''
    },
    // 请求参数
    params: {
      type: Object,
      default: () => ({})
    },
    // 选项数据中作为值的键名
    valueKey: {
      type: String,
      default: 'code'
    },
    // 选项数据中作为标签的键名
    labelKey: {
      type: String,
      default: 'message'
    },
    // 直接传入选项数据，如果有这个值则不调用request方法
    options: {
      type: Array,
      default: null
    },
    filterable: {
      type: Boolean,
      default: false
    },
  },
  data () {
    return {
      remoteOptions: [],
      loading: false,
      showValue: this.value
    };
  },
  computed: {
    computedOptions () {
      // 如果传入了options，则使用传入的options，否则使用远程获取的options
      return this.options || this.remoteOptions;
    }
  },
  watch: {
    params: {
      handler () {
        // 只有在没有传入options才重新加载
        if (!this.options) {
          this.loadOptions();
        }
      },
      deep: true
    },
    value: {
      handler (val) {
        // 枚举值只能是string，此处统一处理
        this.showValue = String(val);
      },
      immediate: true
    }
  },
  mounted () {
    // 只有在没有传入options时才加载
    if (!this.options) {
      this.loadOptions();
    }
  },
  methods: {
    // 加载选项数据
    async loadOptions () {
      // 如果没有request方法或者传入了options，则不执行远程请求
      if (!this.request || this.options) return;
      if (this.enumCode) {
        // 获取枚举数据
        const enumData = this.$store.getters['enum/getEnum'](this.enumCode);
        if (enumData) {
          this.remoteOptions = enumData || [];
          return;
        }
      }

      this.loading = true;
      try {
        const response = await this.request(this.enumCode);
        this.remoteOptions = response.data || response || [];
        if (this.enumCode && response) {
          // 缓存枚举数据
          this.$store.dispatch('enum/setEnum', { code: this.enumCode, data: response });
        }
      } catch (error) {
        console.error('Failed to load options:', error);
        this.remoteOptions = [];
      } finally {
        this.loading = false;
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
      // 查找完整的选项对象
      const selectedOption = this.computedOptions.find(
        option => option[this.valueKey] === val
      );
      this.$emit('change', val, selectedOption);
    },
    handleBlur () {
      this.$emit('blur');
    }

    // 手动刷新选项数据
    // refresh () {
    //   // 只有在没有传入options时才能刷新
    //   if (!this.options) {
    //     this.loadOptions();
    //   }
    // }
  }
};
</script>

<style scoped>
.el-select {
  width: 100%;
}
</style>
