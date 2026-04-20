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
 * @event before-upload-click - 上传按钮点击前触发，参数为{ allow, openFileDialog }
 *        - allow(val): 业务页判断完成后调用，传入true继续上传，false阻止
 *        - openFileDialog(): 手动打开文件对话框
 *        - 如果业务页不监听此事件，则默认直接打开文件对话框
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
  <div class="business-upload" :class="uploadClasses">
    <!-- 上传按钮区域 -->
    <span v-if="type==='card' && title" :class="uploadTitleCls" class="upload-title">{{ title }}</span>
    <el-upload
      ref="uploadRef"
      :class=" type==='card' && title ? 'business-upload-area card-upload' : 'business-upload-area'"
      action="#"
      :http-request="httpRequest"
      :headers="uploadHeaders"
      :data="uploadData"
      :multiple="true"
      :limit="limit"
      :fileList="internalFileList"
      :on-change="handleFileChange"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :auto-upload="true"
      :accept="accept"
      :disabled="uploadDisabled"
      :show-file-list="false"
      v-bind="$attrs"
      v-on="$listeners"
    >
      <slot name="trigger" v-if="!readonly">
      <el-button
        size="small"
        type="primary"
        plain
        :loading="uploadLoading"
        :disabled="uploadDisabled"
        v-bind="buttonProps"
        @click="handleTriggerClick"
      >
        {{ buttonText }}
      </el-button>
      </slot>
    </el-upload>

    <!-- 文件展示区域 -->
    <file-display
      v-if="showFilelist"
      ref="fileDisplayRef"
      :file-list="internalFileList"
      :readonly="readonly"
      @delete="handleFileDelete"
      @update="handleUpdate"
      :type="type"
    />
  </div>
</template>

<script>
import FileDisplay from '../FileDisplay';
import { uploadFile, deleteFile, addOrUpdateFile } from '../../../api/attachment';
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
  '.doc': [
    'application/msword',                     // 最标准、最常用
    'application/vnd.ms-word.document.macroEnabled.12', // 带宏的 Word 2007+ 文档（.docm 格式也适用）
    'application/x-msword',                   // 变体格式，常见于某些系统
  ],
  '.rar': [
    'application/x-rar-compressed',
    'application/vnd.rar',
  ],
  '.zip': [
    'application/zip',               // 最标准、最推荐
    'application/x-zip-compressed',  // 传统格式，广泛支持
    'application/x-zip',             // 变体格式
  ],
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

    configCode: {
      type: String,
      default: '',
    },

    /**
     * 可空，如果为空，文件大小不校验，只进行文件类型校验
     */
    attachType: {
      type: String,
      default: '',
    },

    // 是否在上传时自动关联到单据businessId上
    isAttached: {
      type: Boolean,
      default: true,
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

    // 上传附加数据
    uploadData: {
      type: Object,
    },
    buttonText: {
      type: String,
      default: '上传附件'
    },
    buttonProps: {
      type: Object,
    },
    // 上传相关配置
    uploadConfig: {
      type: Object,
    },
    // API配置
    apiConfig: {
      type: Object,
      default: () => ({
        uploadApi: uploadFile,
        deleteApi: deleteFile,
        addOrUpdateFileApi: addOrUpdateFile,
      })
    },
    //
    type: {
      type: String,
      default: 'default',
      validator: (value) => {
        return ['default', 'card'].includes(value);
      }
    },
    title: {
      type: String,
      default: '',
    },
    uploadClass: {
      type: String,
      default: '',
    },
    // 是否展示文件列表
    showFilelist: {
      type: Boolean,
      default: true
    },
  },

  data () {
    return {
      internalFileList: [],
      uploadLoading: false,
      loading: false,
      // 记录正在上传的文件
      uploadingFiles: new Set(),
      // 防抖定时器
      updateTimer: null,
    };
  },

  computed: {
    uploadTitleCls() {
      const isRequired = this.uploadConfig?.required === '1';
      return {
        isRequired,
      };
    },
    uploadClasses() {
      return {
        [this.uploadClass]: true,
        'card': this.type === 'card',
      }
    },
    uploadRef () {
      return this.$refs.uploadRef;
    },

    // 上传请求头
    uploadHeaders () {
      return {
        Authorization: `Bearer ${this.getToken()}`,
      };
    },

    limit () {
      return this.uploadConfig?.maxNum || 0; // 0不限制
    },

    accept () {
      return this.uploadConfig?.acceptSuffix || '';
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
    uploadLoading: {
      handler(newVal) {
        this.$emit('upload-loading-change', newVal);
      },
      immediate: true
    }
  },
  mounted () {
  },
  methods: {
    // 触发按钮点击处理
    handleTriggerClick (e) {
      // 阻止原生事件的传播，防止 el-upload 的原生监听器打开对话框
      e.stopPropagation();
      e.preventDefault();

      // 打开文件对话框的方法
      const openFileDialog = () => {
        if (this.uploadRef) {
          // 尝试多种方式获取 el-upload 内部的 file input
          let fileInput = this.uploadRef.$refs.input;
          if (!fileInput) {
            // Element UI 可能把 input 放在 $el 下面
            const uploadEl = this.uploadRef.$el;
            fileInput = uploadEl?.querySelector('input[type="file"]');
          }
          if (!fileInput) {
            // 尝试从组件内部查找
            const uploadInner = this.uploadRef.$refs.uploadInner;
            fileInput = uploadInner?.$refs?.input;
          }
          if (fileInput) {
            fileInput.click();
          }
        }
      };

      // 抛出事件，业务页判断完调用 allow(true) 继续，否则调用 allow(false)
      // 使用 Promise 等待业务层的异步判断结果
      // 如果外部没有监听事件，则默认放行
      const hasListener = this.$listeners['before-upload-click'];
      new Promise((resolve) => {
        this.$emit('before-upload-click', {
          allow: (val = true) => {
            resolve(val);
          },
          openFileDialog,
        });
        // 如果外部没有监听器，则立即默认放行
        if (!hasListener) {
          resolve(true);
        }
      }).then((allowUpload) => {
        if (allowUpload) {
          openFileDialog();
        }
      });
    },
    // 获取token
    getToken () {
      // 根据你的实际情况获取token
      return localStorage.getItem('token') || '';
    },
    async httpRequest (options) {
      const { file, onSuccess, onError } = options;
      const fileId = file.uid;
      try {
        this.uploadingFiles.add(fileId);
        if (this.uploadingFiles.size === 1) {
          this.uploadLoading = true;
        }

        // 第一步：调用 uploadFile 上传文件
        const formData = new FormData();
        formData.append('file', file);
        // 添加额外的数据（如果有的话）
        if (this.uploadData) {
          Object.keys(this.uploadData).forEach(key => {
            formData.append(key, this.uploadData[key]);
          });
        }
        const uploadRes = await this.apiConfig.uploadApi(formData);
        // 第二步：准备 addOrUpdateFile 的参数
        const data = uploadRes.data || {};
        const addOrUpdateParams = {
          fileId: data.id,
          fileName: data.originalFilename || data.filename,
          fileUrl: data.url,
          fileSize: data.size,
          fileType: data.ext,
          // 从外部传入的参数
          attachType: this.attachType,
          businessId: this.businessId,
          configCode: this.configCode,
        };
        // 如果有 id 属性，也添加进去
        if (this.id) {
          addOrUpdateParams.id = this.id;
        }
        // 是否需要关联到单据
        if (this.isAttached) {
          await this.apiConfig.addOrUpdateFileApi?.(addOrUpdateParams);
        } else {
          const param = {
            addOrUpdateParams,
            file,
          };
          this.$emit('addParam', param);
        }
        onSuccess();
      } catch (error) {
        console.error('上传失败:', error);
        onError(error);
      } finally {
        this.uploadingFiles.delete(fileId);
        if (this.uploadingFiles.size === 0) {
          this.uploadLoading = false;
          // 全部上传完更新
          if (this.isAttached) {
            this.handleUpdate();
          }
        }
      }
    },

    // 增强版的验证方法，同时验证后缀名和MIME类型
    validateFileType(file) {
      // ".png,.jpg,.jpeg,.gif,.pdf,.ppt,.pptx,.xlsx,.xls,.docx,.doc,.rar,.zip,.mp4"
      if (!this.accept) {
        return true;
      }
      const fileName = file.name || '';
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

      const allowedExtensions = this.accept
        .split(',')
        .map(ext => ext.trim().toLowerCase());

        // 后缀名验证
      const isValidExtension = allowedExtensions.includes(fileExtension);

      const mimeTypes = allowedExtensions.map(ext => {
        return mimeTypeMap[ext];
      });
      const isValidMimeType = mimeTypes?.flat()?.includes(file.type);

      return isValidExtension && isValidMimeType;
    },
    handleExceed () {
      this.$message.warning(`最多只能上传 ${this.limit} 个文件`);
    },
    // 上传前处理
    beforeUpload (file) {
      // 文件类型
      if (!this.validateFileType(file)) {
        this.$message.info(`请上传文件类型为${this.accept}的文件`);
        return false;
      }
      // 文件大小验证
      if (this.uploadConfig?.maxSize) {
        const maxSize = this.uploadConfig.maxSize * 1024 * 1024; // 转换为字节
        if (file.size > maxSize) {
          this.$message.warning(`文件大小不能超过${this.uploadConfig.maxSize}M`);
          return false;
        }
      }

      return true;
    },

    handleFileChange (file, fileList) {
      // 手动关联
      if (!this.isAttached) {
        this.internalFileList = fileList.map(file => {
          if (file.raw && !file.url) {
            const fileType = file.raw.type;
            const isImage = fileType.startsWith('image/');
            const isVideo = fileType.startsWith('video/');
            const isExcel = [
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ].includes(fileType);
            const isPdf = fileType === 'application/pdf';
            const isPPT = [
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ].includes(fileType);
            const isText = fileType === 'text/plain';
            const isWord = [
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ].includes(fileType);
            const isZip = [
              'application/zip',
              'application/x-zip-compressed',
            ].includes(fileType);
            return {
              ...file,
              url: URL.createObjectURL(file.raw),
              isImage,
              isVideo,
              isExcel,
              isPdf,
              isPPT,
              isWord,
              isText,
              isZip,
            }
          }
          return file;
        });
        this.$emit('input', this.internalFileList);
        this.$emit('change', this.internalFileList);
      }
    },

    // 上传成功
    handleUploadSuccess (response, file, fileList) {
    },

    // 上传失败
    handleUploadError (err, file, fileList) {
      this.$emit('error', err, file, fileList);
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

        if (file.id && !file.raw) {
          await this.apiConfig.deleteApi([file.id]);
          this.$message.success('删除成功');
          this.handleUpdate();
        } else {
          this.internalFileList.splice(index, 1);
          this.$emit('input', this.internalFileList);
          this.$emit('change', this.internalFileList);
          this.$emit('removeParam', file, index);
        }

      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error);
          this.$message.error('删除失败');
        }
      }
    },

    handleUpdate () {
      this.$emit('update');
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
      // 清空上传队列
      this.uploadingFiles.clear();
      this.uploadLoading = false;
    },

    // 获取文件列表
    getFileList () {
      return this.internalFileList;
    },
  }
};
</script>

<style lang="scss">
div:has(> .business-upload.card) {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}
</style>
<style lang="scss" scoped>
.business-upload {
  position: relative;
  width: 100%;
  &.card{
    width: calc((100% - 32px) / 3);
    border-radius: 4px;
    padding: 16px;
    background-color: #F8F7F7;
    margin-right: 16px;
    margin-bottom: 16px;
    min-width: 356px;

    &:nth-child(3n+3) {
      margin-right: 0;
    }
    ::v-deep .el-upload{
      justify-content: flex-end;
    }
  }
  .upload-title{
    position: absolute;
    font-size: 14px;
    font-weight: 500;
    line-height: 32px;
    text-align: left;
    &.isRequired::before{
      content: '*';
      display: inline-block;
      margin-right: 4px;
      color: var(--leap-color-danger);
    }
  }
}

.business-upload-area {
  margin-bottom: 16px;
  height: 32px;
  width: 120px;
  ::v-deep .el-upload{
    display: flex;
  }
}
.card-upload {
  width: 100%;
}
</style>
