<!-- 编辑页面布局容器 -->
<!--
  -- 使用方式：
  <edit-page-layout ref="editLayout" title="标题" showPaneFooter>
    <template #left>
      // 原页面
    </template>
    <template #right>
      // 填入组件
    </template>
  </edit-page-layout>
  -- 打开和关闭
    this.$refs.editLayout.openPane();
    this.$refs.editLayout.closePane();
-->
<template>
  <splitpanes class="default-theme">
    <pane>
      <slot name="left"></slot>
      <slot></slot>
    </pane>
    <pane v-if="showPane" :size="width">
      <div class="right-panel">
        <div class="panel-header">
          <div class="header-title">
            <slot name="title">{{ title }}</slot>
          </div>
          <div class="header-actions">
            <i class="iconfont icon-lxppc-close" @click="closePane()"></i>
          </div>
        </div>
        <div class="panel-content">
          <slot name="right"></slot>
        </div>
        <div class="panel-footer" v-if="showPaneFooter">
          <slot name="footer">
            <el-button size="small" type="primary" @click="handleSave">保存</el-button>
            <el-button size="small" @click="handleCancel">取消</el-button>
          </slot>
        </div>
      </div>
    </pane>
  </splitpanes>
</template>

<script>
import { Splitpanes, Pane } from '@leapmotor/splitpanes';

export default {
  name: 'EditPageLayout',
  components: {
    Splitpanes,
    Pane
  },
  props: {
    // 是否显示右侧面板
    showPaneFooter: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    width: {
      type: Number,
      default: 40
    }
  },
  data () {
    return {
      showPane: false
    };
  },
  methods: {
    openPane () {
      this.showPane = true;
    },
    // 暴露关闭右侧面板的方法
    closePane () {
      this.showPane = false;
    },
    handleSave () {
      // 触发保存事件，让父组件处理具体逻辑
      this.$emit('save');
    },
    handleCancel () {
      // 触发取消事件，让父组件处理具体逻辑
      this.$emit('cancel');
      this.showPane = false;
    }
  }
};
</script>

<style>
  .splitpanes.default-theme .splitpanes__splitter {
    z-index: 99;
    width: 0px;
  }
  .splitpanes.default-theme .splitpanes__splitter:before {
    border-radius: 10px;
    width: 3px;
    height: 24px;
    background: url(./indicator.svg);
  }
  .splitpanes.default-theme .splitpanes__splitter:after {
    width: 0;
  }
  .splitpanes .splitpanes__pane {transition: none;}
</style>
<style scoped>
/* splitpanes组件样式 default-theme */
.splitpanes {
  &.default-theme {
    .splitpanes__pane {
      background-color: #fff!important;
      overflow-x: auto;
    }
  }
}

.right-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  .iconfont {
    cursor: pointer;
  }
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--aisDefaultTextColor);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-footer {
  height: 60px;
  line-height: 60px;
  padding: 0 16px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>
