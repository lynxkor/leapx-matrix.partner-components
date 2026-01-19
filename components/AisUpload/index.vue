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
 * @props {String|Number} businessId - 业务ID，必填，用于关联业务数据
 * @props {String} attachType - 附件类型，必填，用于区分不同类型的附件
 * @props {Array} value - 文件列表，用于v-model双向绑定
 * @props {Boolean} showUpload - 是否显示上传按钮，默认true
 * @props {Boolean} editable - 是否可编辑（重命名、删除），默认true
 * @props {Boolean} disabled - 是否禁用所有操作，默认false
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
 * @method addFile(file) - 添加文件到列表
 * @method setFileList(fileList) - 设置文件列表
 * @method loadFileList() - 手动加载文件列表
 *
 *
 * @example 只读模式（仅展示）
 * <ais-upload
 *   :business-id="$route.query.id"
 *   attach-type="#"
 *   :value="existingFiles"
 *   :show-upload="false"
 *   :editable="false"
 *   :disabled="true"
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
 *     :editable="true"
 *     :disabled="false"
 *     :upload-config="getUploadConfig(configItem)"
 *   />
 * </el-form-item>
 */
</script>
<template>
  <div class="business-upload">
    <!-- 上传按钮区域 -->
    <el-upload
      v-if="showUpload"
      ref="uploadRef"
      class="business-upload-area"
      action="#"
      :http-request="customUploadRequest"
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
    >
      <slot name="trigger">
        <el-button
          size="small"
          v-show="editable"
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
      :editable="editable"
      :disabled="disabled"
      @preview="handleFilePreview"
      @rename="handleFileRename"
      @delete="handleFileDelete"
    />
  </div>
</template>

<script>
import FileDisplay from '@/components/FileDisplay';
import { uploadFile, deleteFile, getFileList, addOrUpdateFile } from '@/api/attachment';

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

    // 是否显示上传按钮
    showUpload: {
      type: Boolean,
      default: true
    },

    // 是否可编辑（重命名、删除）
    editable: {
      type: Boolean,
      default: true
    },

    // 是否禁用所有操作
    disabled: {
      type: Boolean,
      default: false
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
        getFileListApi: getFileList,
        addOrUpdateFileApi: addOrUpdateFile // 新增 addOrUpdateFile API 配置
      })
    }
  },

  data () {
    return {
      internalFileList: [],
      uploadLoading: false,
      currentUploadingFiles: [],
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
        ...this.uploadConfig.headers
      };
    },

    // 上传附加数据
    uploadData () {
      return {
        ...this.uploadConfig.data
      };
    },

    // 上传按钮配置
    uploadText () {
      return this.uploadConfig.buttonText || '上传文件';
    },

    uploadButtonType () {
      return 'primary';
    },

    uploadIcon () {
      return this.uploadConfig.buttonIcon || 'el-icon-upload';
    },

    multiple () {
      return this.uploadConfig.multiple !== false;
    },

    limit () {
      return this.uploadConfig.maxNum || 9;
    },

    autoUpload () {
      return this.uploadConfig.autoUpload !== false;
    },

    accept () {
      return this.uploadConfig.accept || '';
    },

    uploadDisabled () {
      return this.disabled || this.uploadLoading;
    }
  },

  watch: {
    value: {
      immediate: true,
      handler (newVal) {
        this.internalFileList = [...newVal];
      }
    }
    // businessId: {
    //   immediate: true,
    //   handler (newVal) {
    //     if (newVal && this.autoLoad) {
    //       this.loadFileList();
    //     }
    //   }
    // },
    // attachType: {
    //   immediate: true,
    //   handler (newVal) {
    //     if (newVal && this.businessId && this.autoLoad) {
    //       this.loadFileList();
    //     }
    //   }
    // }
  },

  // mounted () {
  //   if (this.autoLoad && this.businessId && this.attachType) {
  //     this.loadFileList();
  //   }
  // },

  methods: {
    // 获取token
    getToken () {
      // 根据你的实际情况获取token
      return localStorage.getItem('token') || '';
    },

    // 加载文件列表
    async loadFileList () {
      if (!this.businessId || !this.attachType) {
        return;
      }

      try {
        this.loading = true;
        const params = {
          businessId: this.businessId,
          attachType: this.attachType
        };

        const response = await this.apiConfig.getFileListApi(params);
        if (response && response.data) {
          // 格式化文件数据以匹配组件期望的格式
          const formattedFiles = (Array.isArray(response.data) ? response.data : []).map(file => ({
            attachmentId: file.id || file.attachmentId,
            name: file.fileName || file.name,
            url: file.fileUrl || file.url,
            size: file.fileSize || file.size,
            fileType: file.fileType || this.getFileTypeFromName(file.fileName || file.name),
            response: file
          }));

          this.internalFileList = formattedFiles;
          this.$emit('input', this.internalFileList);
          this.$emit('change', this.internalFileList);
        }
      } catch (error) {
        console.error('加载文件列表失败:', error);
        this.$message.error('加载文件列表失败');
      } finally {
        this.loading = false;
      }
    },

    // 从文件名获取文件类型
    getFileTypeFromName (fileName) {
      if (!fileName) return 'file';
      const lowerName = fileName.toLowerCase();

      // 图片类型
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      // 视频类型
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];

      for (const ext of imageExtensions) {
        if (lowerName.endsWith(ext)) return 'image';
      }

      for (const ext of videoExtensions) {
        if (lowerName.endsWith(ext)) return 'video';
      }

      return 'file';
    },

    // 自定义上传请求
    async customUploadRequest (options) {
      const { file, onSuccess, onError } = options;
      try {
        this.uploadLoading = true;
        // 第一步：调用 uploadFile 上传文件
        const formData = new FormData();
        formData.append('file', file);
        // 添加额外的数据（如果有的话）
        if (this.uploadConfig.data) {
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
          fileId: uploadResponseData.id || uploadResponseData.fileId,
          fileName: uploadResponseData.name || uploadResponseData.fileName || file.name,
          fileUrl: uploadResponseData.url || uploadResponseData.fileUrl,
          fileSize: uploadResponseData.size || uploadResponseData.fileSize || file.size,
          fileType: uploadResponseData.ext || uploadResponseData.fileType || this.getFileType(file),
          // 从外部传入的参数
          attachType: this.attachType,
          businessId: this.businessId
        };
        // 如果有 id 属性，也添加进去
        if (this.id) {
          addOrUpdateParams.id = this.id;
        }
        // 第三步：调用 addOrUpdateFile
        let finalResult = uploadResult;
        if (this.apiConfig.addOrUpdateFileApi) {
          finalResult = await this.apiConfig.addOrUpdateFileApi(addOrUpdateParams);
        } else {
          // 如果没有提供 addOrUpdateFileApi，则使用合并后的参数作为最终结果
          finalResult = {
            ...uploadResult,
            data: {
              ...uploadResponseData,
              ...addOrUpdateParams
            }
          };
        }

        // 创建最终的文件对象
        const uploadedFile = {
          ...file,
          attachmentId: finalResult.data?.id || finalResult.data?.fileId || uploadResponseData.id,
          name: finalResult.data?.fileName || finalResult.data?.name || file.name,
          url: finalResult.data?.fileUrl || finalResult.data?.url || uploadResponseData.url,
          size: finalResult.data?.fileSize || finalResult.data?.size || file.size,
          fileType: finalResult.data?.fileType || finalResult.data?.type || this.getFileType(file),
          // 保存完整的响应数据
          response: finalResult.data
        };
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

    // 上传前处理
    beforeUpload (file) {
      this.uploadLoading = true;
      this.currentUploadingFiles.push(file);

      // 调用外部beforeUpload钩子
      if (this.uploadConfig.beforeUpload) {
        const result = this.uploadConfig.beforeUpload(file);
        if (result === false) {
          this.uploadLoading = false;
          this.removeCurrentUploadingFile(file);
          return false;
        }
        return result;
      }

      return true;
    },

    // 移除当前上传文件记录
    removeCurrentUploadingFile (file) {
      const index = this.currentUploadingFiles.findIndex(f => f.uid === file.uid);
      if (index > -1) {
        this.currentUploadingFiles.splice(index, 1);
      }
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
      this.uploadLoading = false;
      // 添加文件到列表
      this.internalFileList.push(file);
      this.updateFileList(this.internalFileList);
      this.$emit('success', response, file, fileList);
      this.$message.success('上传成功');

      // 重新加载文件列表以确保数据同步
      if (this.autoLoad) {
        this.loadFileList();
      }
    },

    // 获取文件类型
    getFileType (file) {
      const name = file.name || '';
      const lowerName = name.toLowerCase();

      // 图片类型
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      // 视频类型
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];

      for (const ext of imageExtensions) {
        if (lowerName.endsWith(ext)) return 'image';
      }

      for (const ext of videoExtensions) {
        if (lowerName.endsWith(ext)) return 'video';
      }

      return 'file';
    },

    // 上传失败
    handleUploadError (err, file, fileList) {
      this.uploadLoading = false;
      this.removeCurrentUploadingFiles(file);
      this.$emit('error', err, file, fileList);
      this.$message.error('上传失败');
    },

    // 移除当前上传文件记录（支持单个或多个）
    removeCurrentUploadingFiles (file) {
      if (file) {
        const index = this.currentUploadingFiles.findIndex(f => f.uid === file.uid);
        if (index > -1) {
          this.currentUploadingFiles.splice(index, 1);
        }
      } else {
        this.currentUploadingFiles = [];
      }
    },

    // 文件预览
    handleFilePreview (file) {
      this.$emit('preview', file);
    },

    // 文件下载
    handleFileDownload (file) {
      this.$emit('download', file);

      // 调用下载接口
      if (file.attachmentId) {
        console.log('1111');
        this.downloadAttachment(file.attachmentId, file.name);
      } else if (file.fileUrl) {
        console.log('2222');
        this.downloadFile(file.fileUrl, file.name);
      }
    },

    // 下载附件
    downloadAttachment (attachmentId, fileName) {
      // 调用你的下载API
      window.open(`/api/attachment/download/${attachmentId}?filename=${encodeURIComponent(fileName)}`, '_blank');
    },

    // 下载文件
    downloadFile (url, fileName) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // 文件重命名
    async handleFileRename ({ file, index, oldName, newName }) {
      if (!this.editable || this.disabled) return;

      try {
        if (file.attachmentId) {
          // 调用重命名API
          await this.apiConfig.renameApi({
            id: file.attachmentId,
            new_name: newName
          });
        }

        // 更新本地文件列表
        this.internalFileList[index].name = newName;
        this.updateFileList(this.internalFileList);

        this.$emit('rename', { file, index, oldName, newName });
        this.$message.success('重命名成功');
      } catch (error) {
        console.error('重命名失败:', error);
        this.$message.error('重命名失败');
        // 回退
        this.internalFileList[index].name = oldName;
      }
    },

    // 文件删除
    async handleFileDelete ({ file, index }) {
      if (!this.editable || this.disabled) return;

      try {
        await this.$confirm('确定删除这个文件吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        console.log('internalFileList:', this.internalFileList);
        // return;
        if (file.attachmentId) {
          // 调用删除API
          await this.apiConfig.deleteApi([file.attachmentId]);
        }

        // 从文件列表中移除
        this.internalFileList.splice(index, 1);
        this.updateFileList(this.internalFileList);
        this.$emit('delete', { file, index });
        this.$message.success('删除成功');

        // 重新加载文件列表以确保数据同步
        if (this.autoLoad) {
          this.loadFileList();
        }
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

    // 添加文件到列表
    addFile (file) {
      this.internalFileList.push({
        ...file,
        fileType: file.fileType || this.getFileType(file)
      });
      this.updateFileList(this.internalFileList);
    },

    // 设置文件列表
    setFileList (fileList) {
      this.internalFileList = [...fileList];
      this.updateFileList(this.internalFileList);
    },

    // // 手动刷新文件列表
    // refreshFileList () {
    //   return this.loadFileList();
    // }
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
