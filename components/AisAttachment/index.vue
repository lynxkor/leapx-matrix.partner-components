<script>
/**
 * AisAttachment 组件 - 通用附件上传组件
 * @property {string|number} businessId - 业务ID，详情页或者编辑页的id
 * @property {String} configCode - 实体名称 https://cepsit.leapmotor.com/cepsit/main.aspx#280103004
 * @property {String} attachType - 附件类型 https://cepsit.leapmotor.com/cepsit/main.aspx#280103004
 * @property {boolean} readonly - 是否仅展示，默认为 false
 *
 * @event {Function} on-update - 附件更新时触发的事件
 *
 * @example
 * <!-- 用法一  后端校验规则-->
    <AisAttachment
      :businessId="_id"
      configCode="xxxxxx"
      attachType="其他"
    />
  // 用法二：纯展示，不进行上传和编辑
    <AisAttachment
      :businessId="_id"
      configCode="xxxxxx"
      attachType="其他"
      :readonly="true"
    />

    // 用法三 不走后端校验规则，使用默认校验规则
    <AisAttachment
      :businessId="_id"
      ref="attachment"
    />
    this.$refs.attachment.getAttachment(); // 手动关联附件使用

    // 用法四 自定义校验规则
    <AisAttachment
      :businessId="_id"
      :uploadConfig={
        acceptSuffix: ".png,.jpg,.jpeg,.gif,.pdf,.ppt,.pptx,.xlsx,.xls,.docx,.doc,.rar,.zip,.mp4",
        maxSize: 50, // 50M
        maxNum: 0,
        required: '0',
      }
    />
 */
</script>
<template>
  <ais-upload
    v-model="fileList"
    :business-id="businessId"
    :attach-type="attachType"
    :isAttached="Boolean(configCode)"
    :show-upload="true"
    :readonly="readonly"
    :uploadConfig="internalUploadConfig"
    @update="update"
    @addParam="addParam"
    @removeParam="removeParam"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
import AisUpload from './AisUpload';
import { getByCode, getFileList } from '../../api/attachment';

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
    },
    attachType: {
      type: String,
    },
    readonly: {
      type: Boolean,
      default: false
    },
    // configCode为空时 启用默认配置
    uploadConfig: {
      type: Object,
    },
  },
  data () {
    return {
      // 前端默认配置
      internalUploadConfig: {
        // 前端默认配置
        acceptSuffix: ".png,.jpg,.jpeg,.gif,.pdf,.ppt,.pptx,.xlsx,.xls,.docx,.doc,.rar,.zip,.mp4",
        maxSize: 50, // 50M
        maxNum: 0,
        required: '0', // '0', '1'
      },
      //
      fileList: [],
      loading: false,
      // 手动提交使用
      attachFileList: [],
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
    },
    uploadConfig: {
      handler (newVal) {
        if (!this.configCode) {
          this.internalUploadConfig = newVal;
          console.log('xxxx', newVal);
        }
      },
      deep: true,
    },
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
        // 走后端的校验配置
        if (configCode) {
          let data = null;
          if (attachmentConfigCache.has(configCode)) {
            data = attachmentConfigCache.get(configCode);
          } else {
            const response = await getByCode(configCode);
            data = response?.data;
          }
          if (data && data.detailList) {
            this.internalUploadConfig = data.detailList.find(config => config.attachType === attachType);
          } else {
            throw new Error('获取配置数据失败');
          }
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
      if (!businessId) {
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
    update () {
      this.loadAttachmentFiles(this.businessId, this.attachType);
    },
    addParam (param) {
      this.attachFileList.push(param);
    },
    removeParam (param) {
      const index = this.attachFileList.findIndex(item => item?.file?.name === param.name);
      this.attachFileList.splice(index, 1);
    },
    // 手动执行关联
    getAttachment () {
      return this.attachFileList.map(item => item.addOrUpdateParams);
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
