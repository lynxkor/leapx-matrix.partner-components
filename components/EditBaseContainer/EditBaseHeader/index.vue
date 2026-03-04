<script>
/**
 * @author wangjinqing
 * @description 通用详情页标题组件，提供编辑/查看状态的切换和操作按钮
 *
 * 组件根据 isEditing 状态显示不同的操作按钮：
 * - 编辑状态：显示取消、返回、刷新、保存、保存&关闭按钮
 * - 查看状态：显示编辑按钮
 *
 * 用户交互方法统一前缀：使用 handle 前缀表示用户触发的操作
 *
 * @param {String} title - 详情页标题文本
 * @param {Boolean} isEditing - 是否为编辑状态，控制按钮组的显示，默认 false
 * @param {Boolean} showBackBtn - 是否显示返回按钮，默认 false
 * @param {Boolean} showCancelBtn - 是否显示取消按钮，默认 true
 * @param {Boolean} showRefreshBtn - 是否显示刷新按钮，默认 false
 * @param {Boolean} showSaveBtn - 是否显示保存按钮，默认 true
 * @param {Boolean} showSaveAndCloseBtn - 是否显示保存并关闭按钮，默认 false
 * @param {Boolean} showEditBtn - 是否显示编辑按钮，默认 true
 * @param {Boolean} loading - 加载状态，控制保存按钮的加载动画
 * @param {String} backText - 返回按钮文本，默认 '返回'
 * @param {String} saveText - 保存按钮文本，默认 '保存'
 * @param {String} saveAndCloseText - 保存并关闭按钮文本，默认 '保存&关闭'
 * @param {String} refreshText - 刷新按钮文本，默认 '刷新'
 *
 * @event edit - 点击编辑按钮时触发
 * @event cancel - 点击取消按钮时触发
 * @event submit - 点击保存或保存&关闭按钮时触发
 * @event refresh - 点击刷新按钮时触发
 *
 * @method handleCancel - 处理取消操作，触发 cancel 事件
 * @method handleBack - 处理返回操作，从编辑页返回到详情页
 * @method handleEdit - 处理编辑操作，触发 edit 事件
 * @method handleSave - 保存操作，触发 submit 事件
 * @method handleSaveAndClose - 保存并关闭操作，触发 submit 事件并传递延迟对象
 *
 *
 插槽使用：状态显示
  <template #status>
    <!-- 支持primary,warning,success,danger等状态 -->
    <span class="status primary">状态</span>
  </template>

  插槽使用：额外按钮组
  <template #extraButtons>
    <el-button size="small">按钮1</el-button>
    <el-button size="small">按钮2</el-button>
  </template>
 */
</script>
<template>
  <section class="common-title px-5 edit-base-header" ref="headerRef">
    <!--
      @slot header - 自定义整个标题区域
      @binding {Object} defaultProps - 组件的默认属性
    -->
    <slot name="header" v-bind="{ defaultProps: $props }">
      <div class="header-container">
        <div ref="leftContentRef" class="left-content">
          <h2 class="title-wrapper">
            <span class="title" :title="title">{{ title }}</span>
            <slot name="status"></slot>
          </h2>
        </div>
        <div class="right-content">
          <template v-if="isEditing && canAddOrUpdate">
            <el-button v-if="showCancelBtn" size="small" @click="handleCancel">{{cancelText}}</el-button>
            <el-button v-if="showBackBtn" size="small" @click="handleBack">{{backText}}</el-button>
            <el-button v-if="showRefreshBtn" size="small" type="primary" @click="$emit('refresh')">{{refreshText}}</el-button>
            <el-button v-if="showSaveBtn" size="small" type="primary" @click="handleSave" :loading="loading">{{saveText}}</el-button>
            <el-button v-if="showSaveAndCloseBtn" size="small" type="primary" @click="handleSaveAndClose" :loading="loading">{{ saveAndCloseText }}</el-button>
          </template>
          <template v-else>
            <div v-if="$slots.extraButtons" class="extra-buttons" :style="{width: buttonGroupWidth}">
              <ButtonGroup ref="buttonGroupRef">
                <el-button v-if="canLog" size="small" @click="handleJumpAuditLog">审核日志</el-button>
                <slot name="extraButtons"></slot>
              </ButtonGroup>
            </div>
            <div v-else class="extra-buttons" :style="{width: buttonGroupWidth}">
              <ButtonGroup ref="buttonGroupRef">
                <el-button v-if="canLog" size="small" @click="handleJumpAuditLog">审核日志</el-button>
              </ButtonGroup>
            </div>
            <div class="edit-button-wrapper" ref="editRef">
              <el-divider
                v-if="
                  ($slots.extraButtons && showEditBtn && canAddOrUpdate) ||
                  (!$slots.extraButtons && showEditBtn && canLog)
                "
                class="extra-divider"
                direction="vertical">
              </el-divider>
              <el-button v-if="showEditBtn && canAddOrUpdate" size="small" type="primary" plain @click="handleEdit"><i class="iconfont icon-lxppc-edit"></i>{{editText}}</el-button>
            </div>
          </template>
        </div>
      </div>
    </slot>
  </section>
</template>
<script>

import permissions from '../../../mixins/permissions';
import ButtonGroup from '../../ButtonGroup';
import { getDomStyle } from '../../../utils';

export default {
  components: {
    ButtonGroup,
  },
  props: {
    id: {
      type: String,
      default: ''
    },
    /**
     * 详情页标题
     */
    title: {
      type: String,
      default: '',
    },
    /**
     * 是否为编辑状态
     */
    isEditing: {
      type: Boolean,
      default: false,
    },
    /** */
    loading: {
      type: Boolean,
      default: false,
    },
    /**
     * 取消按钮文本
     */
    cancelText: {
      type: String,
      default: '取消'
    },
    /**
     * 返回按钮文本
     */
    backText: {
      type: String,
      default: '返回'
    },
    /**
     * 是否显示返回按钮
     */
    showBackBtn: {
      type: Boolean,
      default: false,
    },
    /**
     * 是否显示取消按钮，默认 true
     */
    showCancelBtn: {
      type: Boolean,
      default: true,
    },
    /**
     * 是否显示刷新按钮
     */
    showRefreshBtn: {
      type: Boolean,
      default: false,
    },
    /**
     * 是否显示保存按钮，默认 true
     */
    showSaveBtn: {
      type: Boolean,
      default: true,
    },
    /**
     * 是否显示保存并关闭按钮
     */
    showSaveAndCloseBtn: {
      type: Boolean,
      default: false,
    },
    /**
     * 是否显示编辑按钮，默认 true
     */
    showEditBtn: {
      type: Boolean,
      default: true,
    },
    /**
     * 保存按钮文本
     */
    saveText: {
      type: String,
      default: '保存'
    },
    /**
     * 保存并关闭按钮文本
     */
    saveAndCloseText: {
      type: String,
      default: '保存&关闭'
    },
    /**
     * 刷新按钮文本
     */
    refreshText: {
      type: String,
      default: '刷新'
    },
    /**
     * 编辑按钮文本
     */
    editText: {
      type: String,
      default: '编辑'
    }
  },
  inject: ['moduleKey'],
  mixins: [permissions],
  data () {
    return {
      buttonGroupWidth: undefined,
      resizeObserver: null
    };
  },
  watch: {
    isEditing() {
      // 当编辑状态改变时重新计算宽度
      this.$nextTick(() => {
        this.measureButtonGroupWidth();
      });
    },
    title() {
      // 当标题改变时重新计算宽度
      this.$nextTick(() => {
        this.measureButtonGroupWidth();
      });
    },
    // 监听 $slots 对象的变化
    '$slots.extraButtons': {
      handler (newVal, oldVal) {
        this.$nextTick(() => {
          this.updateGroupWidth();
        });
      },
      deep: true, // 深度监听
    }
  },
  created () {
    if (!this.moduleKey) {
      console.log(`%c未能获取到moduleKey，按钮权限丢失`, 'color: red; font-weight: bold;');
    }
  },
  mounted() {
    this.measureButtonGroupWidth();

    // 监听窗口大小变化
    window.addEventListener('resize', this.updateGroupWidth, false);

    // 使用 ResizeObserver 监听元素大小变化
    if (this.$refs.headerRef && this.$refs.leftContentRef) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateGroupWidth();
      });
      this.resizeObserver.observe(this.$refs.headerRef);
      this.resizeObserver.observe(this.$refs.leftContentRef);
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateGroupWidth);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },
  methods: {
    handleCancel () {
      this.$emit('cancel');
    },
    handleBack () {
    },
    handleEdit () {
      this.$emit('edit');
    },
    handleSave () {
      this.$emit('submit');
    },
    handleSaveAndClose () {
      this.$emit('submit', this.handleBack);
    },
    updateGroupWidth () {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.measureButtonGroupWidth();
      }, 100);
    },
    measureButtonGroupWidth() {
      this.$nextTick(() => {
        if (!this.$refs.headerRef || !this.$refs.leftContentRef || !this.$refs.buttonGroupRef) return;

        const headerStyle = getDomStyle(this.$refs.headerRef); // 总宽度
        const headerWidth = headerStyle.width;
        const padding = headerStyle.paddingLeft + headerStyle.paddingRight; // 【详情页面】左右padding的值

        const leftStyle = getDomStyle(this.$refs.leftContentRef); // 标题+状态的宽度
        const leftContentWidth = leftStyle.width;

        const margin = leftStyle.marginLeft + leftStyle.marginRight; // 【详情页面】标题跟按钮组件之间的margin值
        const editWidth = getDomStyle(this.$refs.editRef).width || 0; // 编辑按钮宽度

        // 计算可用宽度：header总宽度减去leftContent宽度，再减去一些边距
        const availableWidth = headerWidth - padding - margin - editWidth;

        const minWidth = 80; // 最小80px，预留【...】按钮宽度

        if (leftContentWidth <= 300) { // 标题缩到最小时触发
          const actureWidth = availableWidth - leftContentWidth;
          this.buttonGroupWidth = `${Math.max(actureWidth, minWidth)}px`;
          // console.log('标题缩到最小时触发', leftContentWidth, availableWidth, this.buttonGroupWidth);
        } else {
          const availableActionsWidth = this.$refs.buttonGroupRef.getWidth();
          if (availableWidth - 300 < availableActionsWidth) {
            const actureWidth = availableWidth - 300;
            this.buttonGroupWidth = `${Math.max(actureWidth, minWidth)}px`;
          } else {
            this.buttonGroupWidth = `${availableActionsWidth}px`;
          }
          // console.log('标题不到最小', leftContentWidth, availableWidth, availableActionsWidth, this.buttonGroupWidth);
        }

        // 这里必须异步，保证内部获取的大小是正确的
        setTimeout(() => {
          // 非常重要：更新ButtonGroup的布局
          this.$refs.buttonGroupRef && this.$refs.buttonGroupRef.calculateLayout();
        }, 0);
      });
    },
    // 审核日志
    handleJumpAuditLog () {
      this.$auditLog.show({ id: this.id });
    },
  }
};
</script>
<style lang="scss" scoped>
.px-5{
  padding-left: 16px;
  padding-right: 16px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.left-content {
  flex: 0 1 70%; /* 最大宽度为 70% */
  min-width: 300px; /* 重要：允许内容收缩 */
  margin-right: 32px;
  .title-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px; /* status 和 title 之间的间距 */
    margin: 0;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0; /* 重要：允许文本省略 */
  }
  .status {
    display: inline-block;
    padding: 2px 10px;
    color: #2261DD;
    line-height: 20px;
    font-size: 12px;
    background: #E9EEF9;
    margin-left: 6px;
    border-radius: 4px;
    position: relative;
    top: 1px;
    &.primary{
      color: #2261DD;
      background: #E9EEF9;
    }
    &.warning{
      color: #C8A12B;
      background: #FAF6EA;
    }
    &.success{
      color: #009100;
      background: #E6F4E6;
    }
    &.danger{
      color: #B91919;
      background: #F8E8E8;
    }
  }
}

.right-content {
  flex-shrink: 0; /* 防止右侧内容被压缩 */
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  .extra-buttons{
    flex: 1;
  }
  .edit-button-wrapper{
    display: flex;
    align-items: center;
    .extra-divider{
      height: 24px;
      margin: 4px 12px;
      background-color: #E6E6E5;
    }
  }
}

</style>
