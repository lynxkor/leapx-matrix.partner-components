<script>
/**
<base-tabs
  :items="items"
  :value="selectedTab"
  closeTip="确定删除该公共车型吗？"
  @change="onTabChange"
  @close="onTabClose"
  @add="onTabAdd"
  >
  <template slot="add-popover">
    <fetch-select
      filterable
      clearable
      remote
      reserve-keyword
      v-model="tabValue"
      :remote-method="tabValueRemote"
      @change="handleTabValueChange"
      value-key="id"
      label-key="registeredModelName"
      placeholder="请输入公告车型代码/名称"
    />
  </template>
</base-tabs>
 */
</script>

<template>
  <div
    class="base-tabs-wrapper"
    :class="{
      normal: isNormal,
      rect: isRect,
    }"
    ref="wrapper">
    <div class="base-tabs" ref="leapTabs">
      <div
        v-for="(item, index) in items.slice(0, moreStartIndex)"
        :key="item.value"
        class="base-tab"
        :class="{
          active: item.value === value,
          line: isNormal || isMenu,
          rect: isRect,
        }"
        :ref="el => setTabRef(el, index)"
        @click="handleClick(item, index)">
        <div class="base-tab-content">
          <span class="name">{{item.label}}</span>
          <!-- 关闭按钮 -->
          <span @click.stop v-if="showCloseBtn">
            <el-popconfirm
              v-show="!item.disableClose"
              :title="closeTip"
              confirm-button-type="danger"
              :confirm-button-text="closeText"
              @confirm="handleClose(item, index)"
            >
              <i slot="reference" class="iconfont icon-lxppc-close"></i>
            </el-popconfirm>
          </span>
          <!-- 关闭按钮 -->
          <DropdownActions
            v-if="isMenu"
            :menus="menus"
            @command="(command) => $emit('command', command, item, index)"
            />
        </div>
      </div>
    </div>
    <div class="base-tabs-actions" ref="leapActions">
      <!-- more -->
      <el-popover
        placement="bottom-end"
        title=""
        trigger="hover"
        popper-class="base-tabs-popover"
        >
        <div class="base-tabs">
          <div
            v-for="(item, index) in items.slice(moreStartIndex)"
            :key="item.value"
            class="base-tab"
            :class="{
              active: item.value === value,
              line: isNormal || isMenu,
              rect: isRect,
            }"
            @click="handleClick(item, index)">
            <div class="base-tab-content">
              <span class="name">{{item.label}}</span>
              <!-- 关闭按钮 -->
              <span @click.stop v-if="showCloseBtn">
                <el-popconfirm
                  v-show="!item.disableClose"
                  :title="closeTip"
                  confirm-button-type="danger"
                  @confirm="handleClose(item, moreStartIndex + index)"
                >
                  <i slot="reference" class="iconfont icon-lxppc-close"></i>
                </el-popconfirm>
              </span>
              <!-- 关闭按钮 -->
               <DropdownActions
                v-if="isMenu"
                :menus="menus"
                @command="(command) => $emit('command', command, item, index)"
                />
            </div>
          </div>
        </div>
        <!-- 查看更多 -->
        <div v-show="moreStartIndex <= items.length - 1" class="base-tab-more" slot="reference">
          <i class="iconfont icon-lxppc-t-more"></i>
        </div>
        <!-- 查看更多 -->
      </el-popover>

      <!-- 添加按钮 -->
       <el-popover
        v-if="!disabled"
        placement="bottom-end"
        title=""
        trigger="click"
        >
        <slot name="add-popover"></slot>
        <div slot="reference" class="base-tab-add">
          <i class="iconfont icon-lxppc-plus"></i>
        </div>
      </el-popover>
      <!-- 添加按钮 -->
    </div>
  </div>
</template>
<script>

import DropdownActions from './DropdownActions';
export default {
  components: {
    DropdownActions,
  },
  props: {
    // 展示类型，normal: 下划线+关闭图标
    // menu: 下拉菜单
    // rect: 边框+关闭图标
    type: {
      type: String,
      default: 'normal',
      validator: (value) => {
        return ['normal', 'menu', 'rect'].includes(value);
      }
    },
    // type = 'menu' 时使用，下拉菜单功能
    menus: {
      type: [Array], // {label, value}
      default: () => ([]),
    },
    items: {
      type: [Array],
      default: () => [],
    },
    value: {
      type: [String, Number],
    },
    closeTip: {
      type: String,
    },
    closeText: {
      type: String,
      default: '确定'
    },
    disabled: {
      type: Boolean,
      default: false,
    }
  },
  data () {
    return {
      tabRefs: [], // 存储所有 tab 的 ref
      moreStartIndex: this.items.length,
      //
      resizeObserver: null,
    };
  },
  computed: {
    showCloseBtn () {
      return !this.disabled && (this.type === 'normal' || this.type === 'rect');
    },
    isNormal () {
      return this.type === 'normal';
    },
    isMenu () {
      return this.type === 'menu';
    },
    isRect () {
      return this.type === 'rect';
    },
  },
  watch: {
    items: {
      deep: true,
      handler (newItems, oldItems) {
        this.updateLayout();
      }
    },
    disabled: {
      handler () {
        this.updateLayout();
      },
    }
  },
  mounted () {
    this.initResizeObserver();
    this.updateLayout();
  },
  updated () {
  },
  methods: {
    initResizeObserver () {
      // 创建 ResizeObserver 实例
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === this.$refs.wrapper) {
            // 防抖处理，避免频繁触发
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
              this.updateMoreStartIndex();
            }, 100);
          }
        }
      });

      // 开始观察 wrapper 元素
      if (this.$refs.wrapper) {
        this.resizeObserver.observe(this.$refs.wrapper);
      }
    },
    updateMoreStartIndex () {
      this.$nextTick(() => {
        if (!this.$refs.wrapper || !this.$refs.leapActions) {
          return;
        }
        const boxStyle = window.getComputedStyle(this.$refs.wrapper);
        const actionsStyle = window.getComputedStyle(this.$refs.leapActions);
        const boxWidth = parseInt(boxStyle.width) - parseInt(actionsStyle.width);

        let sum = 0;

        for (let i = 0; i < this.tabRefs.length; i++) {
          const ele = this.tabRefs[i];
          const tabStyle = window.getComputedStyle(ele);
          const width = parseFloat(tabStyle.width);
          const mr = parseFloat(tabStyle.marginRight);
          const ml = parseFloat(tabStyle.marginLeft);
          const cur = Math.ceil(width + mr + ml);

          sum += cur;
          if (sum > boxWidth) {
            this.moreStartIndex = i;
            return;
          }
        }

        this.moreStartIndex = this.items.length;
      });
    },
    handleClick (item, index) {
      this.$emit('change', item, index);
    },
    handleClose (item, index) {
      //
      this.$emit('close', item, index);
    },
    handleAdd () {
      this.$emit('add');
    },
    // 设置 ref 的回调函数
    setTabRef (el, index) {
      if (el) {
        this.tabRefs[index] = el;
      }
    },
    // 更新布局
    updateLayout () {
      this.updateMoreStartIndex();
    },
  },
  beforeDestroy () {
    // 组件销毁时清理观察器
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  },
};
</script>
<style lang="scss">
.base-tabs-popover{
  width: auto!important;
  padding: 4px;
}
</style>
<style lang="scss" scoped>
.base-tabs-popover {
  .base-tab.rect .base-tab-content {
    border: 0;
  }
  .base-tab.rect.active .base-tab-content {
    border: 0;
    background: var(--leap-color-primary-light-9);
  }
  .base-tab {
    border-radius: 4px;
  }
  .base-tab:hover {
    background: var(--leap-color-primary-light-9);
  }
  .base-tab.rect {
    margin: 4px 0 4px 0;
  }
}
.base-tabs-wrapper{
  width: 100%;
  display: flex;
  align-items: flex-start;
  position: relative;
  &.normal::after{
    content: ' ';
    width: 100%;
    position: absolute;
    z-index: 0;
    bottom: 0px;
    display: block;
    border-bottom: 1px solid #E6E6E5;
  }
  &.rect{
    height: 30px;
    .base-tabs-actions{
      height: 28px;
    }
  }
  .base-tabs{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    position: relative;
  }

  .base-tabs-actions{
    display: flex;
    height: 40px;
    align-items: center;
    .base-tab-more, .base-tab-add{
      position: relative;
      right: 0px;
      width: 28px;
      height: 28px;
      color: #3B3E3B;
      border-radius: 4px;
      padding: 6px;
      border: 1px solid #E6E6E5;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      .icon-lxppc-plus, .icon-lxppc-t-more{
        font-size: 12px;
      }
      &:hover{
        border-color: var(--leap-green);
        color: var(--leap-green);
      }
    }
    .base-tab-more{
      margin-right: 4px;
    }
  }
}
.base-tab{
  height: 40px;
  line-height: 40px;
  margin-right: 20px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  .base-tab-content{
    line-height: 40px;
    border-bottom: 2px solid transparent;
    .name{
      vertical-align: middle;
      color: #3B3E3B;
      font-size: 14px;
    }
    .iconfont {
      vertical-align: middle;
      margin-left: 4px;
      color: #9D9F9D;
      &:hover{
        color: var(--leap-green);
      }
    }
    &:hover{
      .name{
        color: var(--leap-green);
      }
    }
  }
  &.line.active {
    .base-tab-content{
      border-bottom-color: var(--leap-green);
      position: relative;
      z-index: 1;
      .name{
        color: var(--leap-green);
      }
    }
  }
  &.rect {
    height: 28px;
    line-height: 28px;
    margin-right: 8px;
    .base-tab-content{
      padding: 0 16px;
      line-height: 26px;
      border-radius: 4px;
      border: 1px solid #E6E6E5;
      .name{
        position: relative;
        top: -1px;
      }
      .iconfont{
        position: relative;
        top: -1px;
      }
    }
    &.active {
      .base-tab-content{
        border: 1px solid var(--leap-green);
        position: relative;
        z-index: 1;
        .name{
          color: var(--leap-green);
        }
      }
    }
  }
}

</style>
