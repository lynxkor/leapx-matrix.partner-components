<template>
  <el-dialog
    :title="title"
    :visible="visible"
    custom-class="ais-upload-modal"
    width="600px"
    append-to-body
    @close="handleClose"
  >
    <div class="upload-modal-step">
      1.模版下载：
      <el-button
        type="text"
        style="vertical-align: baseline"
        @click="downloadTemplate"
      >模板文件</el-button>
    </div>
    <div class="upload-modal-step">2.上传填好的模版</div>
    <el-upload
      ref="upload"
      :limit="1"
      accept=".xlsx, .xls"
      :disabled="isUploading"
      :headers="headers"
      :action="uploadAction"
      :data="form"
      :on-success="handleFileSuccess"
      :file-list="fileList"
      drag
    >
      <div class="el-upload__inner">
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </div>
      <div slot="tip" class="el-upload__tip">
        <span>只能上传excel文件，且大小不超过20MB</span>
      </div>
    </el-upload>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button
        type="primary"
        :loading="isUploading"
        @click="submitFileForm"
        size="small"
      >确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getTemplateUrl } from '@/api/common';
import { downloadFile, downloadExcel } from '../../../utils';

export default {
  name: 'UploadModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    id: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: '导入'
    },
    // templateUrl: {
    //   type: String,
    //   default: ''
    // },
    // uploadUrl: {
    //   type: String,
    //   default: ''
    // }
  },
  data () {
    return {
      // 是否禁用上传
      isUploading: false,
      // 是否更新已经存在的用户数据
      updateSupport: 0,
      // 设置上传的请求头部
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
      form: {},
      fileList: []
    };
  },
  computed: {
  // 使用计算属性动态获取上传地址
    uploadAction () {
      return process.env.VUE_APP_WORK_ORDER_URL + '/file/fileService/uploadMultipartFile';
    }
  },
  methods: {
    handleClose () {
      this.$refs.upload.clearFiles();
      this.$emit('close');
    },
    // 文件上传校验成功处理
    handleFileSuccess (response, file, fileList) {
      if (response.code === 200) {
        this.$emit('success', response);
        this.$message({
          message: '导入成功',
          type: 'success'
        });
      } else {
        this.$message({
          message: `${response.msg}`,
          type: 'error'
        });
        this.$refs.upload.clearFiles();
      }
      this.isUploading = false;
    },
    submitFileForm () {
      const submit = () => {
        const file = this.$refs.upload.uploadFiles;
        console.log('file', file);
        if (file.length < 1) {
          return this.$message({
            message: '请选择文件',
            type: 'error'
          });
        }
        this.isUploading = true;
        this.$refs.upload.submit();
      };
      if (this.$refs.uploadRef) {
        this.$refs.uploadRef.validate(valid => {
          if (valid) {
            submit();
          }
        });
      } else {
        submit();
      }
    },
    // 获取接口方法下载模板
    async downloadTemplate () {
      console.log(this.id);
      const res = await getTemplateUrl(this.id);
      downloadExcel(res?.excelModelUrl, res.fileName || '模板');
    },
  }
};
</script>
<style lang="scss">
.ais-upload-modal{
  color: var(--aisDefaultTextColor);
  border-radius: 8px;
  .el-dialog__header {
    border-bottom: 1px solid #E6E6E5;
    padding: 12px 20px;
    font-weight: 700;
    .el-dialog__title{
      font-size: 14px;
      color: var(--aisDefaultTextColor);
    }
    .el-dialog__headerbtn{
      top: 16px;
    }
  }
  .el-dialog__body {
    padding: 20px 20px 48px 20px;
    color: var(--aisDefaultTextColor);
    .el-icon-upload{
      color: rgba($color: #009100, $alpha: 0.2);
      margin-top: 55px;
    }
  }
  .el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #E6E6E5;
  }
  .el-upload {
    width: 100%;
  }
  .el-upload-dragger{
    width: 100%;
    height: 206px;
  }
  .el-upload__tip{
    color: #9d9d9d;
  }
  .upload-modal-step{
    margin-bottom: 12px;
  }
}
</style>
