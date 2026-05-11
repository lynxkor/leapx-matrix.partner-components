<template>
  <el-dialog
    :visible.sync="visible"
    :class="['message-dialog', typeClass]"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :show-close="showClose"
  >
    <div class="message-content">
      <!-- 内容区域 -->
      <div class="message-body">
        <!-- 标题和图标在同一行 -->
        <div v-if="localTitle" class="message-title-wrapper">
          <i v-if="iconClass" :class="['message-icon', iconClass]"></i>
          <span class="message-title">{{ localTitle }}</span>
        </div>
        <!-- 描述 -->
        <div v-if="localDescription || $slots.default" class="message-description">
          <slot>{{ localDescription }}</slot>
        </div>
        <!-- 自定义内容 -->
        <div v-if="$slots.content" class="message-custom-content">
          <slot name="content"></slot>
        </div>
      </div>
    </div>
    <!-- 底部按钮 -->
    <div v-if="showFooter" slot="footer" class="message-footer">
      <el-button size="small" v-if="localShowCancel" @click="handleCancel">{{ localCancelText }}</el-button>
      <el-button size="small" type="primary" @click="handleConfirm">{{ localConfirmText }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'MessageDialog',
  props: {
    // 弹窗类型：info, warning, danger
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'warning', 'danger', 'success'].includes(value)
    },
    // 标题
    title: {
      type: String,
      default: ''
    },
    // 描述内容
    description: {
      type: String,
      default: ''
    },
    // 弹窗宽度
    width: {
      type: String,
      default: '360px'
    },
    // 是否显示底部按钮
    showFooter: {
      type: Boolean,
      default: true
    },
    // 是否显示取消按钮
    showCancel: {
      type: Boolean,
      default: false
    },
    // 取消按钮文字
    cancelText: {
      type: String,
      default: '取消'
    },
    // 确认按钮文字
    confirmText: {
      type: String,
      default: '确定'
    },
    // 点击遮罩层是否关闭
    closeOnClickModal: {
      type: Boolean,
      default: false
    },
    // 是否显示关闭按钮
    showClose: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      visible: false,
      localTitle: this.title,
      localDescription: this.description,
      localType: this.type,
      localShowCancel: this.showCancel,
      localConfirmText: this.confirmText,
      localCancelText: this.cancelText
    };
  },
  computed: {
    typeClass () {
      return `message-dialog--${this.localType}`;
    },
    iconClass () {
      const iconMap = {
        info: 'el-icon-info',
        warning: 'el-icon-warning',
        danger: 'el-icon-error',
        success: 'el-icon-success'
      };
      return iconMap[this.localType] || 'el-icon-info';
    }
  },
  methods: {
    // 打开弹窗
    open (options = {}) {
      if (options.title !== undefined) this.localTitle = options.title;
      if (options.description !== undefined) this.localDescription = options.description;
      if (options.type) this.localType = options.type;
      if (options.showCancel !== undefined) this.localShowCancel = options.showCancel;
      if (options.confirmText) this.localConfirmText = options.confirmText;
      if (options.cancelText) this.localCancelText = options.cancelText;
      this.visible = true;
    },
    // 关闭弹窗
    close () {
      this.visible = false;
    },
    // 确认
    handleConfirm () {
      this.$emit('confirm');
      this.close();
    },
    // 取消
    handleCancel () {
      this.$emit('cancel');
      this.close();
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/libs/assets/styles/variables.scss';

.message-dialog {
  ::v-deep .el-dialog__header {
    display: none;
  }

  ::v-deep .el-dialog__body {
    padding: 24px;
  }

  ::v-deep .el-dialog__footer {
    padding: 12px 24px;
    border-top: 0;
  }

  .message-content {
    display: flex;
    gap: 16px;

    .message-body {
      flex: 1;
      min-width: 0;

      .message-title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .message-title {
          font: var(--el-font-path-medium, 500);
          font-size: 16px;
          line-height: 24px;
          color: var(--leap-color-default);
        }

        .message-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
      }

      .message-description {
        font: var(--el-font-path-regular, 400);
        font-size: 14px;
        line-height: 22px;
        color: var(--leap-color-default-light-1);
        word-break: break-all;
      }

      .message-custom-content {
        margin-top: 12px;
      }
    }
  }

  .message-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  // 类型颜色样式
  &.message-dialog--info ::v-deep .message-icon {
    color: var(--leap-color-default);
  }

  &.message-dialog--warning ::v-deep .message-icon {
    color: var(--leap-color-warning);
  }

  &.message-dialog--danger ::v-deep .message-icon {
    color: var(--leap-color-danger);
  }

  &.message-dialog--success ::v-deep .message-icon {
    color: var(--leap-color-success);
  }
}
</style>
