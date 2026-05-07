<template>
  <div class="ais-button-group" ref="container" :class="`collapse-${collapseDirection}`" :style="{ maxWidth }">
    <!-- 从右往左折叠时(默认): 更多按钮在左侧 -->
    <el-dropdown
      v-if="hasHiddenButtons && collapseDirection === 'right'"
      @command="handleDropdownCommand"
      class="more-dropdown more-dropdown-left"
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
    <!-- 可见按钮区域 -->
    <div class="visible-buttons" ref="visibleButtons">
      <slot/>
    </div>
    <!-- 从左往右折叠时: 更多按钮在右侧 -->
    <el-dropdown
      v-if="hasHiddenButtons && collapseDirection === 'left'"
      @command="handleDropdownCommand"
      class="more-dropdown more-dropdown-right"
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
import { getDomStyle } from '../../utils/index';

export default {
  name: 'ButtonGroup',
  props: {
    // 最大宽度
    maxWidth: {
      type: [Number, String],
      default: '100%'
    },
    // 折叠方向: 'right' 从右往左折叠(默认) | 'left' 从左往右折叠
    collapseDirection: {
      type: String,
      default: 'right',
      validator: (value) => ['left', 'right'].includes(value)
    }
  },
  data () {
    return {
      visibleButtons: [], // 可见按钮
      hiddenButtons: [], // 隐藏按钮
      buttonWidths: [], // 按钮宽度缓存
      originalButtons: [], // 原始按钮数据
      mutationObserver: null // MutationObserver 实例
    };
  },

  computed: {
    hasHiddenButtons () {
      return this.hiddenButtons.length > 0;
    }
  },

  watch: {
    collapseDirection: {
      handler () {
        this.$nextTick(() => {
          this.calculateLayout();
        });
      }
    }
  },

  mounted () {
    this.$nextTick(() => {
      this.setupButtons();
      this.calculateLayout();
      this.setupResizeObserver();
      this.setupMutationObserver();
    });
  },

  beforeDestroy () {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this.handleResize);
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
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
        const style = getDomStyle(el);
        return Math.ceil(style.width + style.marginLeft + style.marginRight);
      });
    },

    // 计算布局
    calculateLayout () {
      if (!this.$refs.container || this.originalButtons.length === 0) {
        this.visibleButtons = [...this.originalButtons];
        this.hiddenButtons = [];
        return;
      }

      const style = getDomStyle(this.$refs.container);
      const availableWidth = style.width;
      const dropdownSize = 60; // 预留下拉菜单宽度(width + margin), 如果下拉菜单有变，需要修改
      let totalWidth = 0;
      let visibleCount = 0;

      if (this.collapseDirection === 'left') {
        // 从左往右折叠: 从前向后遍历,优先保留左侧按钮
        for (let i = 0; i < this.buttonWidths.length; i++) {
          const buttonWidth = this.buttonWidths[i];
          if (totalWidth + buttonWidth <= availableWidth) {
            totalWidth += buttonWidth;
            visibleCount++;
          } else {
            // 检查是否需要为下拉菜单预留空间
            if (availableWidth - totalWidth <= dropdownSize) {
              visibleCount = Math.max(0, visibleCount - 1);
            }
            break;
          }
        }
        // 可见按钮: 前N个
        this.visibleButtons = this.originalButtons.slice(0, visibleCount);
        // 隐藏按钮: 从第N个开始到末尾
        this.hiddenButtons = this.originalButtons.slice(visibleCount);
      } else {
        // 从右往左折叠(默认): 从后向前遍历,优先保留右侧按钮
        for (let i = this.buttonWidths.length - 1; i >= 0; i--) {
          const buttonWidth = this.buttonWidths[i];
          if (totalWidth + buttonWidth <= availableWidth) {
            totalWidth += buttonWidth;
            visibleCount++;
          } else {
            if (availableWidth - totalWidth <= dropdownSize) {
              visibleCount = Math.max(0, visibleCount - 1);
            }
            break;
          }
        }
        // 可见按钮: 后N个
        this.visibleButtons = this.originalButtons.slice(this.originalButtons.length - visibleCount);
        // 隐藏按钮: 从开头到第N个
        this.hiddenButtons = this.originalButtons.slice(0, this.originalButtons.length - visibleCount);
      }

      // 更新按钮显示状态
      this.updateButtonVisibility();
    },

    // 更新按钮显示状态
    updateButtonVisibility () {
      if (!this.$refs.visibleButtons) return;

      const allButtons = this.$refs.visibleButtons.querySelectorAll('.group-button, .el-button');
      const isCollapseFromLeft = this.collapseDirection === 'left';

      if (isCollapseFromLeft) {
        // 从左往右折叠: 索引 0 到 visibleButtons.length-1 可见
        allButtons.forEach((button, index) => {
          button.style.display = index < this.visibleButtons.length ? '' : 'none';
        });
      } else {
        // 从右往左折叠: 索引 visibleStartIndex 到末尾可见
        const visibleStartIndex = this.originalButtons.length - this.visibleButtons.length;
        allButtons.forEach((button, index) => {
          button.style.display = index >= visibleStartIndex ? '' : 'none';
        });
      }
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

    // 设置 MutationObserver 监听 slot 内容变化
    setupMutationObserver () {
      if (!this.$refs.visibleButtons) return;

      this.mutationObserver = new MutationObserver((mutations) => {
        // 检查是否有子节点变化（按钮的添加/删除）
        const hasChildListChange = mutations.some(mutation => mutation.type === 'childList');

        this.$nextTick(() => {
          // 只有按钮数量真正变化时才重新缓存宽度
          if (hasChildListChange) {
            this.setupButtons();
          }
          // 始终重新计算布局（处理容器宽度变化）
          this.calculateLayout();
        });
      });

      this.mutationObserver.observe(this.$refs.visibleButtons, {
        childList: true, // 监听子节点的添加/删除
        subtree: true, // 监听所有后代节点
        attributes: true, // 监听属性变化
        attributeFilter: ['style', 'class'] // 只监听特定属性
      });
    },

    // 窗口大小变化处理（兼容模式）
    handleResize () {
      this.calculateLayout();
    },

    // 获取按钮宽度缓存，外部调用
    getWidth () {
      return this.buttonWidths.reduce((total, width) => total + width, 0);
    }
  }
};
</script>

<style scoped>
.ais-button-group {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
  justify-content: flex-end; /* 默认从右往左排列 */
}

/* 从左往右折叠模式 */
.ais-button-group.collapse-left {
  flex-direction: row;
  justify-content: flex-start; /* 按钮从左侧开始排列 */
}

.visible-buttons {
  display: flex;
  flex-wrap: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

/* 从右往左折叠时的更多按钮(默认位置:左侧) */
.more-dropdown-left {
  flex-shrink: 0;
}

/* 从左往右折叠时的更多按钮(位置:右侧) */
.more-dropdown-right {
  flex-shrink: 0;
  margin-left: 8px;
}

/* 向后兼容 */
.more-dropdown {
  @extend .more-dropdown-left;
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
