<script>
/**
 * 编辑页容器组件，支持表单自动验证，多表单验证，取消编辑，返回上一页，刷新，保存&关闭、保存&再建一个
 * @author wangjinqing
 * @description 基于
 *
 * @param {String} id - 详情页id
 * @param {String} title - 详情页标题
 * @param {Boolean} isEditing - 是否为编辑状态
 * @param {Function} submitRequest 表单的保存接口，保存，保存&关闭、保存&再建一个都是调用这个方法
 * @param {Function} detailRequest 获取表单内容的详情接口，编辑查看详情时使用；
 * @param {DataTransformFunction} dataTransform 详情接口数据转换函数，将详情接口数据转换成表单数据
 * @param {Boolean} direction 表单是横向排列，还是纵向排列，横向排列具有响应式，根据屏幕宽度自动换行
 *
 * @event submit - 没有传递submitRequest时，会触发submit提交
 *
 * 用户交互方法统一前缀：使用 handle 前缀表示用户触发的操作
 * @method handleSubmit
 * @method handleCancel
 * @method handleReset
 * @method handleRefresh
 * @method handleEdit
 *
 * @method registerForm - (内部注册方法)
 * @method updateForm - (内部更新方法)
 * @method updateIsEditing - (内部状态更新方法)
 * @method cancelEdit - (内部业务逻辑方法)
 * @method resetToOriginal - (内部业务逻辑方法)
 * @method resetToDefault - (内部业务逻辑方法)
 *
 *
 * 详情接口数据转换函数
 * @callback DataTransformFunction
 * @param {Object} detailData - 从详情接口获取的原始数据
 * @returns {Object} 转换后的表单数据，会直接赋值给组件的 this.form
 *
 * 使用案例可以查看文件 views/claimreturn/claim/basic/techServiceActivity/edit.vue
 * 页面访问 http://localhost:7779/service/claimreturn/claim/basic/techServiceActivity/edit
 *
 * @example
 * 编辑页容器
  <edit-base-container
    :id="_id"
    :title="`活动编码：${form.activityCode}`"
    :isEditing.sync="isEditing"
    :form.sync="form"
    :submitRequest="submitRequest"
    :detailRequest="detailRequest"
    :dataTransform="dataTransform"
  >
    <template #status>
      <span class="status primary">状态</span>
    </template>
    <template #extraButtons>
      <el-button size="small">按钮1</el-button>
      <el-button size="small">按钮2</el-button>
    </template>
    <el-form :inline="true" :model="form" :rules="rules" ref="ruleForm" label-width="150px"  class="form-edit" v-show="isEditing || !_id">
      ...
    </el-form>
  </edit-base-container>
 */
</script>
<template>
  <div class="page-common-edit" :class="{
    'vertical page-common-add': direction === 'vertical',
  }">
    <el-container direction="vertical" v-loading="detailLoading">
      <edit-base-header
        v-if="id"
        v-bind="$attrs"
        :title="title"
        :isEditing="isEditing"
        :loading="loading"
        @edit="handleEdit"
        @cancel="handleCancel"
        @refresh="handleRefresh"
        @submit="handleSubmit"
      >
        <!-- headers -->
        <template v-if="$slots.status" #status>
          <slot name="status"></slot>
        </template>
        <template v-if="$slots.extraButtons" #extraButtons>
          <slot name="extraButtons"></slot>
        </template>
        <!-- headers -->

        <!-- 使用具名插槽传递 header -->
        <template v-if="$slots.header" #header>
          <slot name="header"></slot>
        </template>
      </edit-base-header>
      <!-- 使用作用域插槽 -->
      <slot></slot>
      <edit-base-footer
        v-if="!id"
        v-bind="$attrs"
        :loading="loading"
        @reset="handleReset"
        @submit="handleSubmit"
      >
        <!-- 使用具名插槽传递 footer -->
        <template v-if="$slots.footer" #footer>
          <slot name="footer"></slot>
        </template>
      </edit-base-footer>
    </el-container>
  </div>
</template>
<script>
import EditBaseHeader from './EditBaseHeader';
import EditBaseFooter from './EditBaseFooter';
import { cloneDeep } from 'lodash';

export default {
  name: 'EditBaseContainer',
  inheritAttrs: false,
  components: {
    EditBaseHeader,
    EditBaseFooter,
  },
  inject: ['formRefs'], // 注入表单实例
  props: {
    /**
     * 表单数据
     */
    form: {
      type: Object,
      default: () => ({}),
    },
    /**
     * 详情页id
     */
    id: {
      type: String,
    },
    /**
     * 详情页标题
     */
    title: {
      type: String
    },
    /**
     * 是否为编辑状态
     */
    isEditing: {
      type: Boolean,
      default: false,
    },
    /**
     * 保存提交接口
     */
    submitRequest: {
      type: Function,
      default: null,
    },
    /**
     * 获取详情接口
     */
    detailRequest: {
      type: Function,
      default: null,
    },
    /**
     * 详情数据转换函数
     */
    dataTransform: {
      type: Function,
      default: (data) => data
    },
    /**
     * 表单是横向排列，还是纵向排列
     */
    direction: {
      type: 'vertical' | 'horizontal',
      default: 'horizontal',
    }
  },
  data () {
    return {
      loading: false,
      // 表单初始值
      defaultForm: {},
      originalForm: {},
      //
      detailLoading: false,
    };
  },
  computed: {
  },
  mounted () {
    this.defaultForm = cloneDeep(this.form);
    this.loadDetail();
  },
  methods: {
    async loadDetail() {
      if (!this.detailRequest) {
        return;
      }
      try {
        this.detailLoading = true;
        const res = await this.detailRequest?.();
        this.detailLoading = false;
        if (!res) {
          return;
        }
        const transformedData = this.dataTransform ? this.dataTransform(res): res;
        const newForm = { ...this.defaultForm, ...transformedData };
        this.updateForm(newForm);
        this.originalForm = cloneDeep(newForm);
      } catch (error) {
        this.detailLoading = false;
      }
    },
    // 表单注册
    registerForm (formRef) {
      if (!this.formRefs.includes(formRef)) {
        this.formRefs.push(formRef);
      }
    },
    handleBack () {
      this.$router.back();
    },
    // 保存操作
    async handleSubmit (success) {
      for (let formRef of this.formRefs) {
        await formRef?.validate();
      }
      if (this.submitRequest) {
        this.loading = true;
        const promise = this.submitRequest?.();
        if (promise instanceof Promise) {
          promise.then((res) => {
            // 新建保存时需要用到这个id
            let id;
            if (typeof res === 'string') {
              id = res;
            }

            // 编辑时必须调用
            if (this.id) {
              if (success) { // 保存并关闭，回到列表页
                success();
              } else if (this.detailRequest) {
                this.loadDetail?.(); // 普通保存重新获取数据（留在当页）
              }
            } else if (success) {
              // 新建时必须调用
              success(id);
            }
            this.showSuccessMessage();
          }).finally(() => {
            this.loading = false;
          })
        } else {
          this.loading = false;
        }
      } else {
        this.$emit('submit', success);
      }
    },
    // 新建时，再建一个
    handleReset () {
      for (let formRef of this.formRefs) {
        formRef?.resetFields();
      }
      this.resetToDefault();
    },
    // 编辑时，取消操作
    handleCancel () {
      // 清除验证
      for (let formRef of this.formRefs) {
        formRef?.clearValidate();
      }
      this.cancelEdit();
    },
    handleRefresh () {
      this.resetToOriginal();
      this.loadDetail();
    },
    updateForm (newForm) {
      this.$emit('update:form', newForm);
    },
    handleEdit () {
      this.updateIsEditing(true);
    },
    updateIsEditing (val) {
      this.$emit('update:isEditing', val);
    },
    // 编辑，点击取消按钮
    cancelEdit () {
      this.updateIsEditing(false);
      this.resetToOriginal();
    },
    // 编辑，操作刷新时需要恢复操作前状态
    resetToOriginal () {
      this.updateForm(cloneDeep(this.originalForm));
    },
    // 保存&再建一个 操作成功后需要初始化
    resetToDefault () {
      this.updateForm(cloneDeep(this.defaultForm));
    },
    // 显示成功消息
    showSuccessMessage () {
      this.$message({
        message: '保存成功',
        type: 'success'
      });
    },
  }
};
</script>
<style lang="scss" scoped>
</style>
