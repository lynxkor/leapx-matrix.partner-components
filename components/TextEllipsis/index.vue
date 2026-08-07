<template>
    <div class="text-ellipsis-wrapper">
      <el-tooltip
        :content="tooltipText"
        :disabled="!showTooltip"
        :placement="placement"
        :open-delay="500"
        :popper-class="popperClass"
        v-bind="$attrs"
      >
        <div
          ref="contentRef"
          class="text-content"
          :style="{ textAlign: align }"
          :class="[lineClampClass]"
          @mouseenter="handleMouseEnter"
        >
          <slot>{{ content }}</slot>
        </div>
      </el-tooltip>
    </div>
  </template>

<script>
export default {
  name: 'TextEllipsis',
  props: {
    content: {
      type: String,
      default: ''
    },
    // 单行还是多行省略
    lines: {
      type: Number,
      default: 1
    },
    placement: {
      type: String,
      default: 'top'
    },
    align: {
      type: String,
      default: 'left'
    },
    popperClass: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      showTooltip: false,
      tooltipText: ''
    };
  },
  computed: {
    lineClampClass () {
      return this.lines > 1 ? `line-clamp-${this.lines}` : 'single-line';
    }
  },
  methods: {
    handleMouseEnter () {
      const el = this.$refs.contentRef;
      if (!el) return;
      // 单行比较宽度,多行比较高度
      this.showTooltip = this.lines > 1
        ? el.scrollHeight > el.clientHeight
        : el.scrollWidth > el.clientWidth;
      // 从 DOM 取实际文本,避免插槽内容非响应式导致 tooltip 文案不同步
      this.tooltipText = el.textContent;
    }
  }
};
</script>

  <style scoped>
  .text-ellipsis-wrapper {
    width: 100%;
  }
  .text-content.single-line {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text-content[class*="line-clamp-"] {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
  }

  .line-clamp-1 {
    -webkit-line-clamp: 1;
  }

  .line-clamp-2 {
    -webkit-line-clamp: 2;
  }

  .line-clamp-3 {
    -webkit-line-clamp: 3;
  }
  </style>
