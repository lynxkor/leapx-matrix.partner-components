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
      1.模板下载：<span
        class="upload-modal-link"
        @click="downloadTemplate"
      >《{{ downloadTitle }}》</span>
    </div>
    <div class="upload-modal-step">2.上传填好的模板</div>
    <el-upload
      ref="upload"
      :limit="1"
      accept=".xlsx, .xls"
      :disabled="isUploading"
      :headers="headers"
      :action="uploadAction"
      :auto-upload="false"
      :on-change="handleFileChange"
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
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button
        type="primary"
        :loading="isUploading"
        @click="submitFileForm"
        size="small"
      >确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getTemplateCode, importExcelConfirmFile } from '@/api/common';
import { downloadExcel } from '../../utils';
// import api from '@/axios';

export default {
  name: 'UploadModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: '导入'
    },
    // 下载模板标题
    downloadTitle: {
      type: String,
      default: '模板文件'
    },
    businessParams: {
      type: String
    },
    async: { // 是否异步导入
      type: Boolean
    }
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
      fileList: [],
      currentFile: null,
    };
  },
  computed: {
  // 使用计算属性动态获取上传地址
    uploadAction () {
      return (window.APP_AIS_WEB_CONFIG?.VUE_APP_WORK_ORDER_URL || process.env.VUE_APP_WORK_ORDER_URL) + '/file/fileService/uploadMultipartFile';
    }
  },
  methods: {
    handleClose () {
      this.$refs.upload.clearFiles();
      this.$emit('close');
    },
    // 文件选择变化
    handleFileChange (file, fileList) {
      if (fileList.length > 0) {
        this.currentFile = file.raw;
      }
    },

    // 手动上传
    async submitFileForm () {
      if (!this.currentFile) {
        return this.$message.error('请选择文件');
      }
      // 文件校验
      const isExcel = this.currentFile.name.endsWith('.xls') || this.currentFile.name.endsWith('.xlsx');
      const isLt20M = this.currentFile.size / 1024 / 1024 < 20;

      if (!isExcel) {
        return this.$message.error('只能上传 Excel 文件!');
      }
      if (!isLt20M) {
        return this.$message.error('文件大小不能超过 20MB!');
      }

      this.isUploading = true;

      try {
        const formData = new FormData();
        formData.append('file', this.currentFile);
        //  1  2种方法都可 暂时使用第二种 第一种需要手动拼接参数
        // const params = new URLSearchParams({
        //   id: this.id,
        //   token: localStorage.getItem('token') || ''
        // }).toString();
        // const url = `/data/ExcelManage/importExcelConfirm?${params}`;
        // const response = await api.postExport(url, formData, 'post', '', '', {
        //   headers: {
        //     'Content-Type': 'multipart/form-data',
        //     Authorization: `Bearer ${localStorage.getItem('token')}`
        //   }
        // });
        // 构建 config 对象并根据条件添加 businessParams
        const config = {
          id: this.id,
          token: localStorage.getItem('token'),
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        };
        // 如果存在 businessParams，则添加到 config 中；否则不包含该字段
        if (this.businessParams) {
          config.businessParams = this.businessParams;
        }
        if (this.async) {
          config.async = this.async;
        }
        const res = await importExcelConfirmFile(formData, config);
        if (this.async) {
          this.$confirm('正在导出中，是否要跳转"系统管理-文件管理-导出任务"中查看？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            window.open('/service/excelManagement/commonDataProcessExcelTask', '_blank');
          }).catch(() => {});
          this.fileList = [];
          this.currentFile = null;
          this.handleClose();
          return;
        }
        if (res.failExcelUrl || res.failNum > 0) { // 判断是否有未上传成功错误文件 有的话 直接走自动下载逻辑
          // 判断有文件 未上传成功时 在提示
          this.$message.error(`文件上传成功${res.successNum}条,失败${res.failNum}条,将自动下载失败文件!`);
          setTimeout(() => {
            downloadExcel(res?.failExcelUrl, res?.fileName || res?.businessType || '模板.xlsx');
          }, 2000);
          this.$emit('getData');
        } else {
          this.$message.success('文件上传成功');
          this.$emit('getData');
        }
        // 公共清理逻辑
        this.fileList = [];
        this.currentFile = null;
        this.handleClose();
      } catch (error) {
        this.$message.error('文件上传失败');
        this.fileList = [];
        this.currentFile = null;
        this.$refs.upload && this.$refs.upload.clearFiles();
        this.handleClose();
      } finally {
        this.isUploading = false;
      }
    },
    // 获取接口方法下载模板
    async downloadTemplate () {
      const res = await getTemplateCode(this.id);
      downloadExcel(res?.excelModelUrl, res?.fileName || res?.businessType || '模板.xlsx');
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
    .el-button {
      font-weight: 400;
    }
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
  .upload-modal-link {
    color: var(--themColor);
    cursor: pointer;
  }
}
</style>
