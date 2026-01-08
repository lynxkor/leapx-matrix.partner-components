<template>
  <div class="ais-button-group" ref="container" :style="{ maxWidth }">
    <!-- 可见按钮区域 -->
    <div class="visible-buttons" ref="visibleButtons">
      <slot/>
    </div>

    <!-- 更多按钮下拉菜单 -->
    <el-dropdown
      v-if="hasHiddenButtons"
      @command="handleDropdownCommand"
      class="more-dropdown"
    >
      <el-button class="more-button" size="small">
        <i class="iconfont icon-lxppc-t-more"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          v-for="button in hiddenButtons"
          :key="button.key || button.text"
          :command="button.key || button.text"
          :divided="button.divided"
        >
          <i v-if="button.icon" :class="button.icon"></i>
          {{ button.text }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'ButtonGroup',
  props: {
    // 最大宽度
    maxWidth: {
      type: [Number, String],
      default: '100%'
    }
  },
  data () {
    return {
      visibleButtons: [], // 可见按钮
      hiddenButtons: [], // 隐藏按钮
      buttonWidths: [], // 按钮宽度缓存
      originalButtons: [] // 原始按钮数据
    };
  },

  computed: {
    hasHiddenButtons () {
      return this.hiddenButtons.length > 0;
    }
  },

  mounted () {
    this.$nextTick(() => {
      this.setupButtons();
      this.calculateLayout();
      this.setupResizeObserver();
    });
  },

  beforeDestroy () {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this.calculateLayout);
    }
  },

  methods: {
    // 设置按钮数据
    setupButtons () {
      this.setupSlotButtons();
    },

    // 从插槽中提取按钮
    setupSlotButtons () {
      const slotButtons = [];
      const buttons = this.$refs.visibleButtons?.querySelectorAll('.group-button, .el-button');

      if (buttons) {
        buttons.forEach((buttonEl, index) => {
          slotButtons.push({
            key: `button_${index}`,
            text: buttonEl.textContent?.trim() || `按钮${index + 1}`,
            element: buttonEl,
            click: () => buttonEl.click()
          });
        });
      }

      this.originalButtons = slotButtons;
      this.cacheButtonWidths();
    },

    // 缓存按钮宽度
    cacheButtonWidths () {
      if (!this.$refs.visibleButtons) return;

      const buttonElements = this.$refs.visibleButtons.querySelectorAll('.group-button, .el-button');
      this.buttonWidths = Array.from(buttonElements).map(el => {
        const style = window.getComputedStyle(el);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;
        return el.offsetWidth + marginLeft + marginRight;
      });
    },

    // 计算布局
    calculateLayout () {
      if (!this.$refs.container || this.originalButtons.length === 0) {
        this.visibleButtons = [...this.originalButtons];
        this.hiddenButtons = [];
        return;
      }

      const container = this.$refs.container;
      const containerWidth = container.offsetWidth;
      let totalWidth = 0;
      let visibleCount = 0;

      console.log('calculateLayout', containerWidth);
      const availableWidth = containerWidth - 40;

      // 计算可以显示多少个按钮
      for (let i = 0; i < this.buttonWidths.length; i++) {
        const buttonWidth = this.buttonWidths[i];
        if (totalWidth + buttonWidth <= availableWidth - 20) {
          totalWidth += buttonWidth;
          visibleCount++;
        } else {
          break;
        }
      }

      // 设置可见和隐藏的按钮
      this.visibleButtons = this.originalButtons.slice(0, visibleCount);
      this.hiddenButtons = this.originalButtons.slice(visibleCount);

      console.log(this.visibleButtons, this.hiddenButtons);

      // 更新按钮显示状态
      this.updateButtonVisibility();
    },

    // 更新按钮显示状态
    updateButtonVisibility () {
      if (!this.$refs.visibleButtons) return;

      const allButtons = this.$refs.visibleButtons.querySelectorAll('.group-button, .el-button');

      allButtons.forEach((button, index) => {
        if (index < this.visibleButtons.length) {
          button.style.display = '';
        } else {
          button.style.display = 'none';
        }
      });
    },

    // 处理下拉菜单点击
    handleDropdownCommand (key) {
      const button = this.hiddenButtons.find(btn =>
        (btn.key || btn.text) === key
      );

      if (button) {
        if (button.click) {
          button.click();
        } else if (button.element) {
          button.element.click();
        }
      }
    },

    // 设置响应式观察
    setupResizeObserver () {
      // if (typeof ResizeObserver !== 'undefined') {
      //   this.resizeObserver = new ResizeObserver(() => {
      //     this.calculateLayout();
      //   });

      //   if (this.$refs.container) {
      //     this.resizeObserver.observe(this.$refs.container);
      //   }
      // } else {
      // }
      window.addEventListener('resize', this.handleResize);
    },

    // 窗口大小变化处理（兼容模式）
    handleResize () {
      this.calculateLayout();
    }
  }
};
</script>

<style scoped>
.ais-button-group {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  overflow: hidden;
  width: 100%;
  justify-content: flex-end;
}

.visible-buttons {
  display: flex;
  flex-wrap: nowrap;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
}

.more-dropdown {
  flex-shrink: 0;
  margin-left: 8px;
}

/* 确保按钮不会换行 */
.ais-button-group ::v-deep .el-button {
  white-space: nowrap;
  flex-shrink: 0;
}

/* 按钮组内的按钮 */
.group-button {
  flex-shrink: 0;
}
</style>
