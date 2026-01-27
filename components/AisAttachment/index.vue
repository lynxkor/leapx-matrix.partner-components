<script>
/**
 * AisAttachment 组件 - 通用附件上传组件
 * @property {string|number} businessId - 业务ID，用于关联附件（可选）
 * @property {String} configCode - 实体名称 https://cepsit.leapmotor.com/cepsit/main.aspx#280103004
 * @property {String} attachType - 附件类型 https://cepsit.leapmotor.com/cepsit/main.aspx#280103004
 * @property {boolean} readonly - 是否仅展示，默认为 false
 *
 * @event {Function} on-update - 附件更新时触发的事件
 *
 * @example
 * <!-- 用法一 -->
    <AisAttachment
      :businessId="_id"
      configCode="mcs_spmusedprtdestory_apply"
      attachType="其他"
    />
  // 用法二：纯展示，不进行上传和编辑
    <AisAttachment
      :businessId="_id"
      configCode="mcs_spmusedprtdestory_apply"
      attachType="其他"
      :readonly="true"
    />
 */
</script>
<template>
  <ais-upload
    v-model="fileList"
    :business-id="businessId"
    :attach-type="attachType"
    :show-upload="true"
    :readonly="readonly"
    :uploadConfig="uploadConfig"
    @update="onUpdate"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
import AisUpload from '@/libs/components/AisUpload';
import { getByCode, getFileList } from '@/libs/api/attachment';

// 根据 configCode 进行缓存
const attachmentConfigCache = new Map();

export default {
  name: 'AisAttachment',
  components: {
    AisUpload
  },
  props: {
    businessId: {
      type: [String, Number],
      default: null
    },
    configCode: {
      type: String,
      required: true
    },
    attachType: {
      type: String,
      required: true
    },
    readonly: {
      type: Boolean,
      default: false
    },
  },
  data () {
    return {
      uploadConfig: null,
      fileList: [],
      loading: false,
    };
  },
  watch: {
    businessId: {
      handler (newVal) {
        if (newVal) {
          this.init();
        }
      },
      immediate: true
    }
  },
  computed: {
  },
  methods: {
    /**
     * 初始化附件数据 - 通用方法
     * @param {string} configCode - 配置代码
     * @param {Array<String>} attachType - 附件类型数组
     * @param {string|number} businessId - 业务ID
     * @param {Function} onSuccess - 成功回调函数 (可选)
     * @param {Function} onError - 错误回调函数 (可选)
     */
    async initAttachmentData (configCode, attachType, businessId, onSuccess = null, onError = null) {
      try {
        this.loading = true;
        // 第一步：获取配置
        await this.loadAttachmentConfig(configCode, attachType);
        // 第二步：获取文件列表
        await this.loadAttachmentFiles(businessId, attachType);

        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess();
        }
      } catch (error) {
        console.error('初始化附件数据失败:', error);
        this.$message?.error('初始化附件数据失败');

        if (onError && typeof onError === 'function') {
          onError(error);
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * 加载附件配置
     * @param {string} configCode - 配置代码
     * @param {String} attachType
     */
    async loadAttachmentConfig (configCode, attachType) {
      try {
        let data = null;
        if (attachmentConfigCache.has(configCode)) {
          data = attachmentConfigCache.get(configCode);
        } else {
          const response = await getByCode(configCode);
          data = response?.data;
        }
        if (data && data.detailList) {
          this.uploadConfig = data.detailList.find(config => config.attachType === attachType);
        } else {
          throw new Error('获取配置数据失败');
        }
      } catch (error) {
        console.error('获取附件配置失败:', error);
        throw error;
      }
    },

    /**
     * 加载附件文件列表
     * @param {string|number} businessId - 业务ID
     */
    async loadAttachmentFiles (businessId, attachType) {
      if (!businessId || !attachType) {
        return;
      }

      try {
        const response = await getFileList({
          businessId: businessId,
          attachType: attachType
        });
        this.fileList = (response?.data || []).map(file => {
          return {
            id: file.id,
            name: file.fileName,
            url: file.fileUrl,
            size: file.fileSize,
            fileType: file.fileType,
            isImage: this.isImageFile(file),
            isVideo: this.isVideoFile(file),
            response: file,
          };
        });
      } catch (error) {
        console.log(error);
      }
    },
    // 初始化附件数据
    init () {
      this.initAttachmentData(
        this.configCode,
        this.attachType,
        this.businessId,
        () => {
        },
        (error) => {
        }
      );
    },
    // 判断是否是图片
    isImageFile (file) {
      if (!file) return false;
      // 从文件类型字段判断
      const fileType = (file.fileType || '').toLowerCase();
      const imageTypes = ['image', 'img', 'picture', 'photo', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
      if (imageTypes.includes(fileType)) {
        return true;
      }
      // 从文件名后缀判断
      const fileName = file.name || '';
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
      const lowerFileName = fileName.toLowerCase();
      return imageExtensions.some(ext => lowerFileName.endsWith(ext));
    },
    // 判断是否为视频文件
    isVideoFile (file) {
      if (!file) return false;
      // 从文件类型字段判断
      const fileType = (file.fileType || '').toLowerCase();
      const videoTypes = ['video', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg'];
      if (videoTypes.includes(fileType)) {
        return true;
      }
      // 从文件名后缀判断
      const fileName = file.name || '';
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.mpeg', '.mpg'];
      const lowerFileName = fileName.toLowerCase();
      return videoExtensions.some(ext => lowerFileName.endsWith(ext));
    },
    // 更新
    onUpdate () {
      this.loadAttachmentFiles(this.businessId, this.attachType);
    }
  },
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
