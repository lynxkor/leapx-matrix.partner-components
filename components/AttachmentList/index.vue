<script>
/**
 * 附件列表组件
 * 支持动态配置，自动加载附件配置并渲染对应的附件上传组件
 * 通过businessId和configCode关联业务数据和附件配置
 * @example
 * <AttachmentList
    :business-id="_id"
    :config-code="configCode"
    type="card"
    :readonly="disabled || !canAddOrUpdate"
    />
 */
</script>
<template>
  <div class="attachment-list">
    <AisAttachment
      v-for="(config) in attachmentConfigs"
      :key="config.id"
      :businessId="businessId"
      :configCode="configCode"
      :attachType="config.attachType"
      :title="config.attachType"
      :uploadConfig="config"
      :readonly="readonly"
      :noEcho="noEcho"
      :businessData="businessData"
      v-bind="$attrs"
      v-on="$listeners"
      @ocr-success="handleOcrSuccess"
    />
  </div>
</template>

<script>
import AisAttachment from '../AisAttachment';
import { getByCode } from '../../api/attachment';

// 缓存配置
const configCache = new Map();
const pendingRequests = new Map();

export default {
  name: 'AttachmentList',
  inheritAttrs: false,
  components: {
    AisAttachment
  },
  props: {
    // 业务ID
    businessId: {
      type: [String, Number],
      default: '',
    },
    // 配置编码
    configCode: {
      type: String,
      required: true,
    },
    // 是否只读
    readonly: {
      type: Boolean,
      default: false
    },
    // 是否不回显
    noEcho: {
      type: Boolean,
      default: false
    },
    // 业务数据
    businessData: {
      type: String,
      default: '',
    }
  },
  data () {
    return {
      attachmentConfigs: [],
      loading: false,
    };
  },
  watch: {
    configCode: {
      handler (val) {
        if (val) {
          this.loadAttachmentConfig();
        }
      },
      immediate: true
    },
    businessData: {
      handler () {
        this.loadAttachmentConfig();
      },
      deep: true,
    }
  },
  methods: {
    /**
     * 加载附件配置
     */
    async loadAttachmentConfig () {
      if (!this.configCode) {
        return;
      }

      try {
        this.loading = true;
        let data = null;

        // 检查缓存
        if (configCache.has(this.configCode)) {
          data = configCache.get(this.configCode);
        } else {
          // 检查是否有正在进行的相同请求
          if (pendingRequests.has(this.configCode)) {
            data = await pendingRequests.get(this.configCode);
          } else {
            // 创建新的请求 Promise
            const requestPromise = getByCode({
              configCode: this.configCode,
              businessData: this.businessData,
            }).then(response => {
              const result = response?.data;
              if (result) {
                configCache.set(this.configCode, result);
              }
              pendingRequests.delete(this.configCode);
              return result;
            }).catch(error => {
              pendingRequests.delete(this.configCode);
              throw error;
            });

            pendingRequests.set(this.configCode, requestPromise);
            data = await requestPromise;
          }
        }

        if (data && data.detailList) {
          this.attachmentConfigs = data.detailList;
          console.log('附件配置加载成功:', this.attachmentConfigs);
        }
      } catch (error) {
        console.error('获取附件配置失败:', error);
        this.$message?.error('获取附件配置失败');
      } finally {
        this.loading = false;
      }
    },

    /**
     * OCR识别成功回调
     */
    handleOcrSuccess (data) {
      this.$emit('ocr-success', data);
    },

    /**
     * 刷新附件列表
     */
    refresh () {
      this.loadAttachmentConfig();
    },

    /**
     * 清空缓存
     */
    clearCache () {
      configCache.delete(this.configCode);
    }
  }
};
</script>

<style lang="scss" scoped>
.attachment-list {
  display: flex;
}
</style>
