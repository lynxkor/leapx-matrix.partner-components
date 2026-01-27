<script>
/**
 * AisUpload - 业务文件上传组件
 *
 * 功能特性：
 * 1. 支持自动加载关联的文件列表（根据businessId和attachType）
 * 2. 支持文件上传、预览、重命名、删除等操作
 * 3. 支持多种文件类型识别（图片、视频、普通文件）
 * 4. 支持自定义API配置，便于适配不同的后端接口
 * 5. 支持v-model双向绑定文件列表
 * 6. 支持多种使用场景：只读模式、编辑模式、仅展示模式
 *
 * @props {String|Number} id - 附件ID，用于更新已存在的附件记录
 * @props {String|Number} businessId - 详情页或者编辑页的id
 * @props {String} configCode - 实体名称 https://cepsit.leapmotor.com/cepsit/main.aspx#280103004
 * @props {String} attachType - 附件类型 https://cepsit.leapmotor.com/cepsit/main.aspx#280103004
 * @props {Array} value - 文件列表，用于v-model双向绑定
 * @props {Boolean} readonly - 是否只读，默认false
 * @props {Boolean} autoLoad - 是否自动加载文件列表，默认true
 * @props {Object} uploadConfig - 上传配置对象
 * @props {Object} apiConfig - API配置对象
 *
 * @event input - 文件列表变化时触发，用于v-model
 * @event change - 文件列表变化时触发，参数为新的文件列表
 * @event success - 上传成功时触发，参数为(response, file, fileList)
 * @event error - 上传失败时触发，参数为(err, file, fileList)
 * @event preview - 文件预览时触发，参数为file对象
 * @event rename - 文件重命名时触发，参数为{file, index, oldName, newName}
 * @event delete - 文件删除时触发，参数为{file, index}
 *
 * @method submit() - 手动触发上传
 * @method clearFiles() - 清空文件列表
 * @method getFileList() - 获取当前文件列表
 *
 *
 * @example 只读模式（仅展示）
 * <ais-upload
 *   :business-id="$route.query.id"
 *   attach-type="#"
 *   :value="existingFiles"
 *   :show-upload="false"
 * />
 *
 *
 * @example 在表单中使用（attach-typ销服配置通过读取getByCode获取)
 * <el-form-item
 *   :label="configItem.attachType + '：'"
 *   :prop="`files_${configItem.attachType}`"
 *   :required="configItem.required === '1'"
 * >
 *   <ais-upload
 *     v-model="fileLists[configItem.attachType]"
 *     :business-id="$route.query.id"
 *     :attach-type="configItem.attachType"
 *     :show-upload="true"
 *     :upload-config="getUploadConfig(configItem)"
 *   />
 * </el-form-item>
 */
</script>
<template>
  <div class="business-upload">
    <!-- 上传按钮区域 -->
    <el-upload
      v-if="!readonly"
      ref="uploadRef"
      class="business-upload-area"
      action="#"
      :http-request="httpRequest"
      :headers="uploadHeaders"
      :data="uploadData"
      :multiple="multiple"
      :limit="limit"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-change="handleFileChange"
      :auto-upload="autoUpload"
      :accept="accept"
      :disabled="uploadDisabled"
      :show-file-list="false"
      v-bind="$attrs"
      v-on="$listeners"
    >
      <slot name="trigger">
        <el-button
          size="small"
          :type="uploadButtonType"
          :icon="uploadIcon"
          :loading="uploadLoading"
          :disabled="uploadDisabled"
        >
          {{ uploadText }}
        </el-button>
      </slot>
    </el-upload>

    <!-- 文件展示区域 -->
    <file-display
      ref="fileDisplayRef"
      :file-list="internalFileList"
      :readonly="readonly"
      @delete="handleFileDelete"
      @update="$emit('update')"
    />
  </div>
</template>

<script>
import FileDisplay from '@/libs/components/FileDisplay';
import { uploadFile, deleteFile, addOrUpdateFile } from '@/libs/api/attachment';
// MIME类型映射
const mimeTypeMap = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.rar': 'application/x-rar-compressed',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4'
};

export default {
  name: 'BusinessUpload',

  components: {
    FileDisplay
  },

  props: {
    // 业务参数
    id: {
      type: [String, Number],
      default: ''
    },

    businessId: {
      type: [String, Number],
      required: true
    },

    attachType: {
      type: String,
      required: true
    },

    // 文件列表
    value: {
      type: Array,
      default: () => []
    },

    readonly: {
      type: Boolean,
      default: true
    },

    // 是否自动加载文件列表
    autoLoad: {
      type: Boolean,
      default: true
    },

    // 上传相关配置
    uploadConfig: {
      type: Object,
      default: () => ({
        multiple: true,
        required: false,
        maxNum: 9,
        minNum: 1,
        autoUpload: true,
        accept: '',
        buttonText: '上传文件',
        buttonType: 'primary',
        buttonIcon: 'el-icon-upload'
      })
    },

    // API配置
    apiConfig: {
      type: Object,
      default: () => ({
        uploadApi: uploadFile,
        deleteApi: deleteFile,
        addOrUpdateFileApi: addOrUpdateFile,
      })
    }
  },

  data () {
    return {
      internalFileList: [],
      uploadLoading: false,
      loading: false
    };
  },

  computed: {
    uploadRef () {
      return this.$refs.uploadRef;
    },

    // 上传请求头
    uploadHeaders () {
      return {
        Authorization: `Bearer ${this.getToken()}`,
        ...this.uploadConfig?.headers
      };
    },

    // 上传附加数据
    uploadData () {
      return {
        ...this.uploadConfig?.data
      };
    },

    // 上传按钮配置
    uploadText () {
      return this.uploadConfig?.buttonText || '上传文件';
    },

    uploadButtonType () {
      return 'primary';
    },

    uploadIcon () {
      return this.uploadConfig?.buttonIcon || 'el-icon-upload';
    },

    multiple () {
      return this.uploadConfig?.multiple !== false;
    },

    limit () {
      return this.uploadConfig?.maxNum || 9;
    },

    autoUpload () {
      return this.uploadConfig?.autoUpload !== false;
    },

    accept () {
      return this.uploadConfig?.accept || '';
    },

    uploadDisabled () {
      return this.readonly || this.uploadLoading;
    }
  },

  watch: {
    value: {
      immediate: true,
      handler (newVal) {
        this.internalFileList = [...newVal];
      }
    },
  },

  methods: {
    // 获取token
    getToken () {
      // 根据你的实际情况获取token
      return localStorage.getItem('token') || '';
    },
    async httpRequest (options) {
      const { file, onSuccess, onError } = options;
      try {
        this.uploadLoading = true;
        // 第一步：调用 uploadFile 上传文件
        const formData = new FormData();
        formData.append('file', file);
        // 添加额外的数据（如果有的话）
        if (this.uploadConfig?.data) {
          Object.keys(this.uploadConfig.data).forEach(key => {
            formData.append(key, this.uploadConfig.data[key]);
          });
        }
        const uploadResult = await this.apiConfig.uploadApi(formData);
        // 第二步：准备 addOrUpdateFile 的参数
        // 从 uploadFile 返回结果中获取 fileId、fileName、fileUrl、fileSize、fileType
        const uploadResponseData = uploadResult.data || {};
        const addOrUpdateParams = {
          // 从 uploadFile 返回的参数
          fileId: uploadResponseData.id,
          fileName: uploadResponseData.filename,
          fileUrl: uploadResponseData.url,
          fileSize: uploadResponseData.size,
          fileType: uploadResponseData.ext,
          // 从外部传入的参数
          attachType: this.attachType,
          businessId: this.businessId
        };
        // 如果有 id 属性，也添加进去
        if (this.id) {
          addOrUpdateParams.id = this.id;
        }
        // 第三步：调用 addOrUpdateFile
        const finalResult = await this.apiConfig.addOrUpdateFileApi?.(addOrUpdateParams);
        this.$emit('update');
        onSuccess(finalResult, uploadedFile);
      } catch (error) {
        console.error('上传失败:', error);
        onError(error);
      } finally {
        this.uploadLoading = false;
      }
    },

    // 文件超出限制
    handleExceed (files, fileList) {
      this.$message.warning(`最多只能上传 ${this.limit} 个文件`);
    },

    // 增强版的验证方法，同时验证后缀名和MIME类型
    validateFileType(file) {
      const acceptSuffix = this.uploadConfig.acceptSuffix;
      const fileName = file.name || '';
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      const allowedExtensions = acceptSuffix
        .split(',')
        .map(ext => ext.trim().toLowerCase());

        // 后缀名验证
      const isValidExtension = allowedExtensions.includes(fileExtension);

      const mimeTypes = allowedExtensions.map(ext => {
        return mimeTypeMap[ext];
      });
      const isValidMimeType = mimeTypes.includes(file.type);

      return isValidExtension && isValidMimeType;
    },
    // 上传前处理
    beforeUpload (file) {
      // 文件类型
      if (!this.validateFileType(file)) {
        const acceptSuffix = this.uploadConfig.acceptSuffix;
        this.$message.info(`请上传文件类型为${acceptSuffix}的文件`);
        return false;
      }
      // 文件大小验证
      if (this.uploadConfig.maxSize) {
        const maxSize = this.uploadConfig.maxSize * 1024 * 1024; // 转换为字节
        if (file.size > maxSize) {
          this.$message.warning(`文件大小不能超过${this.uploadConfig.maxSize}M`);
          return false;
        }
      }
      return true;
    },

    // 文件状态改变
    handleFileChange (file, fileList) {
      // 处理非自动上传的情况
      if (!this.autoUpload) {
        this.updateFileList(fileList);
      }
    },

    // 更新文件列表
    updateFileList (fileList) {
      this.internalFileList = [...fileList];
      this.$emit('input', this.internalFileList);
      this.$emit('change', this.internalFileList);
    },

    // 上传成功
    handleUploadSuccess (response, file, fileList) {
    },

    // 上传失败
    handleUploadError (err, file, fileList) {
      this.uploadLoading = false;
      this.$emit('error', err, file, fileList);
      this.$message.error('上传失败');
    },

    // 文件删除
    async handleFileDelete ({ file, index }) {
      if (this.readonly) return;

      try {
        await this.$confirm('确定删除这个文件吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        if (file.id) {
          await this.apiConfig.deleteApi([file.id]);
        }

        this.$message.success('删除成功');
        this.$emit('update');

      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error);
          this.$message.error('删除失败');
        }
      }
    },

    // 手动上传
    submit () {
      if (this.uploadRef) {
        this.uploadRef.submit();
      }
    },

    // 清空文件列表
    clearFiles () {
      if (this.uploadRef) {
        this.uploadRef.clearFiles();
      }
      this.internalFileList = [];
      this.$emit('input', []);
      this.$emit('change', []);
    },

    // 获取文件列表
    getFileList () {
      return this.internalFileList;
    },

  }
};
</script>

<style lang="scss" scoped>
.business-upload {
  width: 100%;
}

.business-upload-area {
  margin-bottom: 16px;
}
</style>
