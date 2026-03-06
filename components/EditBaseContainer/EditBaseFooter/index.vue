<script>
/**
 * @author wangjinqing
 * @description 通用底部操作栏组件，提供表单操作的标准按钮
 *
 * 组件提供标准操作按钮：
 * - 返回：返回上一页
 * - 保存：保存当前数据
 * - 保存&关闭：保存后关闭当前页面
 * - 保存&再建一个：保存后重置表单，准备创建下一条数据
 *
 * 支持通过插槽自定义底部内容
 *
 * @param {Boolean} loading - 提交加载状态，控制按钮的加载动画
 * @param {String} cancelText - 返回按钮文本，默认 '返回'
 * @param {String} saveText - 保存按钮文本，默认 '保存'
 * @param {String} saveAndCloseText - 保存并关闭按钮文本，默认 '保存&关闭'
 * @param {String} saveAndNextText - 保存并新建按钮文本，默认 '保存&再建一个'
 *
 * @event submit - 提交表单时触发，传递一个延迟对象
 * @event reset - 保存并新建时触发，用于重置表单
 *
 * @method handleCancel - 处理取消/返回操作，使用路由返回上一页
 * @method submitForm - 提交表单的核心方法，根据参数执行不同的后续操作
 * @method handleSave - 处理保存操作
 * @method handleSaveAndClose - 处理保存并关闭操作
 * @method handleSaveAndNext - 处理保存并新建操作
 */
</script>
<template>
  <el-footer height="60px">
    <!-- 支持自定义插槽 -->
    <slot name="footer">
      <el-button v-if="canAddOrUpdate" size="small" type="primary" @click="handleSave" :loading="loading">{{ saveText }}</el-button>
      <!-- <el-button v-if="canAddOrUpdate" size="small" plain type="primary" @click="handleSaveAndClose" :loading="loading">{{ saveAndCloseText }}</el-button> -->
      <el-button v-if="canAddOrUpdate" size="small" plain type="primary" @click="handleSaveAndNext" :loading="loading">{{ saveAndNextText }}</el-button>
      <el-button size="small" @click="handleCancelClick">{{ cancelText }}</el-button>
    </slot>
  </el-footer>
</template>
<script>
import { getRouterPath } from '../../../utils/index';
import permissions from '../../../mixins/permissions';

export default {
  props: {
    /**
     * 提交加载状态
     */
    loading: {
      type: Boolean,
    },
    /**
     * 返回按钮文本
     */
    cancelText: {
      type: String,
      default: '取消'
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
     * 保存并新建按钮文本
     */
    saveAndNextText: {
      type: String,
      default: '保存并再新增'
    },
    /**
     * 刷新按钮文本
     */
    refreshText: {
      type: String,
      default: '刷新'
    },
  },
  inject: ['moduleKey'],
  mixins: [permissions],
  created () {
    if (!this.moduleKey) {
      console.log(`%c未能获取到moduleKey，按钮权限丢失`, 'color: red; font-weight: bold;');
    }
    console.log(this.$router);
  },
  methods: {
    handleCancelClick () {
      this.$emit('cancel');
    },
    handleCancel () {
      this.$router.back();
    },
    submitForm (params = {}) {
      const success = (id) => {
        if (params?.close) {
          this.handleCancel();
        } else if (params?.next) {
          this.$emit('reset');
        } else {
          const path = getRouterPath();
          this.$router.replace({
            path,
            query: {
              id,
            }
          });
        }
      }
      this.$emit('submit', success);
    },
    handleSave () {
      this.submitForm();
    },
    handleSaveAndClose () {
      this.submitForm({ close: true });
    },
    handleSaveAndNext () {
      this.submitForm({ next: true });
    }
  }
};
</script>
