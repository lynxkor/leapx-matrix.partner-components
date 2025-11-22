<!-- 带自动加载枚举选项的下拉框 -->
<template>
  <el-select
    v-bind="$attrs"
    :value="value"
    @input="handleInput"
    @change="handleChange"
    @blur="handleBlur"
    :loading="loading"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.7)"
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
    }
  },
  data () {
    return {
      remoteOptions: [],
      loading: false
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
      this.$emit('input', val);
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
