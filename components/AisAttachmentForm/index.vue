<template>
  <div class="ais-attachment-form">
    <el-form :model="form" :rules="rules" ref="attachmentForm" label-width="150px" inline class="attachment-form form-item-full">
      <el-form-item
        v-for="configItem in uploadConfigs"
        :key="configItem.id"
        :label="showLabel ? configItem.attachType + '：' : ''"
        :prop="`files_${configItem.attachType}`"
        :required="configItem.required === '1'"
      >
        <ais-upload
          v-model="fileLists[configItem.attachType]"
          :business-id="businessId"
          :attach-type="configItem.attachType"
          :show-upload="true"
          :editable="editable"
          :disabled="disabled"
          :upload-config="getUploadConfig(configItem)"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import AisUpload from '@/libs/components/AisUpload';
import { attachmentMixin } from '@/libs/mixins/attachmentMixin.js';

export default {
  name: 'AisAttachmentForm',
  components: {
    AisUpload
  },
  mixins: [attachmentMixin],
  props: {
    businessId: {
      type: [String, Number],
      default: null
    },
    attachType: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: true
    },
    showLabel: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      uploadConfigs: [],
      fileLists: {}
    };
  },
  computed: {
    rules () {
      const formRules = {};
      this.uploadConfigs.forEach(configItem => {
        if (configItem.required === '1') {
          formRules[`files_${configItem.attachType}`] = [
            { required: true, message: `请上传${configItem.attachType}`, trigger: 'change' }
          ];
        }
      });
      return formRules;
    }
  },
  methods: {
    // 初始化附件数据
    initAttachmentFormData () {
      this.initAttachmentData(
        this.attachType,
        this.businessId,
        () => {
          this.$emit('init-success');
        },
        (error) => {
          this.$emit('init-error', error);
        }
      );
    },

    // 获取表单引用
    getFormRef () {
      return this.$refs.attachmentForm;
    },

    // 验证表单
    validate (callback) {
      if (this.getFormRef()) {
        return this.getFormRef().validate(callback);
      }
      return Promise.resolve(true);
    },

    // 重置表单
    resetFields () {
      if (this.getFormRef()) {
        this.getFormRef().resetFields();
      }
    },

    // 获取所有附件数据
    getAttachmentData () {
      return { ...this.fileLists };
    }
  },
  watch: {
    businessId: {
      handler (newVal) {
        if (newVal) {
          this.initAttachmentFormData();
        }
      },
      immediate: true
    }
  }
};
</script>

<style lang="scss" scoped>
.ais-attachment-form {
  .attachment-form {
    display: flex;
    flex-direction: column;
    .el-form-item {
      width: 100%;
    }
  }
}
</style>
