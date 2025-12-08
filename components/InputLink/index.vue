<template>
  <div class="input-link" @click="handleClick">
    <el-input
      v-bind="$attrs"
      v-on="$listeners"
      ref="input"
      :value="value"
      :readonly="readonly"
      :disabled="disabled"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template v-for="(_, slotName) in $slots" #[slotName]>
        <slot :name="slotName"></slot>
      </template>
    </el-input>
  </div>
</template>

<script>
export default {
  name: 'InputLink',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Number],
      default: ''
    },
    link: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleFocus (event) {
      this.$emit('focus', event);
    },
    handleBlur (event) {
      this.$emit('blur', event);
    },
    handleClick () {
      if (!this.link) {
        return;
      }

      // 如果是有效的URL，则在新窗口打开
      if (this.isValidUrl(this.link)) {
        window.open(this.link, '_blank');
      } else {
        // 如果不是有效URL，尝试在当前域名下导航
        const routePath = this.link.startsWith('/') ? this.link : '/' + this.link;
        window.open(routePath, '_blank');
      }
    },
    isValidUrl (string) {
      try {
        // eslint-disable-next-line no-new
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    },
    // 提供给外部调用的方法
    focus () {
      this.$refs.input.focus();
    },
    blur () {
      this.$refs.input.blur();
    },
    select () {
      this.$refs.input.select();
    }
  }
};
</script>

<style lang="scss" scoped>
.input-link {
  cursor: pointer;
  position: relative;

  ::v-deep .el-input__inner {
    cursor: pointer;
    color: var(--themColor);
    text-decoration: underline;
  }

  &.disabled {
    cursor: not-allowed;

    ::v-deep .el-input__inner {
      cursor: not-allowed;
    }

    &:hover ::v-deep .el-input__inner {
      color: var(--aisDefaultTextColor);
      text-decoration: none;
    }
  }
}

.input-link.disabled {
  ::v-deep .el-input.is-disabled .el-input__inner {
    cursor: not-allowed;
  }
}
</style>
