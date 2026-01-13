<template>
  <div>
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
      <!-- <div class="el-upload__inner">
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </div> -->
      <el-button>点击上传</el-button>
      <div slot="tip" class="el-upload__tip">
        <span>只能上传excel文件，且大小不超过20MB</span>
      </div>
    </el-upload>
    <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button
        type="primary"
        :loading="isUploading"
        @click="submitFileForm"
        size="small"
      >确 定</el-button>
  </div>
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
    businessParams: {
      type: String
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
      fileList: [],
      currentFile: null,
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
        this.$message.error('只能上传 Excel 文件!');
        return;
      }
      if (!isLt20M) {
        this.$message.error('文件大小不能超过 20MB!');
        return;
      }

      this.isUploading = true;

      try {
        const formData = new FormData();
        formData.append('file', this.currentFile);
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
        const res = await importExcelConfirmFile(formData, config);
        if (res.failExcelUrl) { // 判断是否有未上传成功错误文件 有的话 直接走自动下载逻辑
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
<style lang="scss" scoped>

</style>
