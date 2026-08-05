<template>
  <tag-input
    :value="innerValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="onInput"
  />
</template>

<script>
import TagInput from '@/libs/components/TagInput';

/**
 * TagInput 的回显包装组件。
 *
 * 背景:公共组件 TagInput 内部的 tagList 固定初始化为 [],只在 value 「发生变化」
 * 时才同步(watch 没有 immediate)。查询列表页里 TagInput 都是先渲染、用户再输入,
 * 所以一直没暴露问题;但自定义条件查询是「先从后端拿到条件树、再创建条件行」,
 * TagInput 创建时 value 就已经有值了,watch 永远不触发 → 等于/不等于(多值)的
 * 文本、数字字段编辑时值带不出来。
 *
 * 这里不改公共组件,改为在外面多存一份 innerValue:挂载完成(子组件已用空数组
 * 初始化)后再把真实值推下去,人为制造一次 value 变化来触发子组件的 watch。
 */
function normalize (val) {
  if (val === null || val === undefined || val === '') return [];
  return Array.isArray(val) ? val : [val];
}

export default {
  name: 'ValueTagInput',
  components: { TagInput },
  props: {
    value: {
      type: [Array, String],
      default: null
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    // 必须以空数组起步:若这里直接给真实值,子组件会把它当初始 prop,watch 同样不触发
    return { innerValue: [] };
  },
  watch: {
    value () {
      this.syncDown();
    }
  },
  mounted () {
    // 子组件此时已完成初始化,再赋值即可触发其 value watch 完成回显
    this.syncDown();
  },
  methods: {
    syncDown () {
      const next = normalize(this.value);
      // 内容一致则跳过,避免 input 事件回流形成死循环
      if (JSON.stringify(next) === JSON.stringify(this.innerValue)) return;
      this.innerValue = next;
    },
    onInput (val) {
      this.innerValue = val;
      this.$emit('input', val);
    }
  }
};
</script>
