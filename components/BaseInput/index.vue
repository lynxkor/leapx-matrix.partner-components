<template>
  <el-input
    v-bind="mergedAttrs"
    v-on="$listeners"
  />
</template>

<script>
export default {
  name: 'BaseInput',
  inheritAttrs: false,
  props: {
    type: {
      type: String,
    }
  },
  computed: {
    // 合并默认的 maxLength 和传入的其他属性
    mergedAttrs () {
      let maxLength;
      if (this.type === 'textarea') {
        maxLength = 500;
      } else {
        maxLength = 100;
      }
      return {
        maxLength,
        type: this.type,
        ...this.$attrs
      };
    }
  },
  mounted () {
  }
};
</script>

<style lang="scss" scoped>

</style>
