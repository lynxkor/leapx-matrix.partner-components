<template>
  <el-dialog
    :title="title"
    :visible="visible"
    width="400px"
    append-to-body
    @close="handleClose"
  >
    <el-upload
      ref="upload"
      :limit="1"
      accept=".xlsx, .xls"
      :disabled="isUploading"
      :headers="headers"
      :action="uploadUrl"
      :data="form"
      :on-success="handleFileSuccess"
      :auto-upload="false"
      :file-list="fileList"
      drag
    >
      <i class="el-icon-upload" />
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <div slot="tip" class="el-upload__tip text-center">
        <span>仅允许导入xls、xlsx格式文件。</span>
        <el-link
          type="primary"
          :underline="false"
          style="font-size: 12px; vertical-align: baseline"
          @click="importTemplate"
        >下载模板</el-link>
      </div>
    </el-upload>
    <div slot="footer" class="dialog-footer">
      <el-button
        type="primary"
        :loading="isUploading"
        @click="submitFileForm"
      >确 定</el-button>
      <el-button @click="handleClose">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'UploadModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    templateUrl: {
      type: String,
      default: ''
    },
    uploadUrl: {
      type: String,
      default: ''
    }
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
        this.handleClose();
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
    importTemplate () {
      if (this.templateUrl) {
        this.download(
          this.templateUrl,
          {},
          '导入模板.xlsx'
        );
      }
    },
  }
};
</script>
