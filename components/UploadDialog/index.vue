<template>
  <el-dialog
    :title="title"
    :visible="visible"
    custom-class="ais-upload-modal"
    width="600px"
    append-to-body
    @close="handleClose"
  >
    <div v-if="templateImportBusiness" class="upload-modal-step">导入业务：{{ templateImportBusiness }}</div>
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
      :on-exceed="handleExceed"
      :show-file-list="false"
      :file-list="fileList"
      drag
    >
      <div v-if="!currentFile" class="el-upload__inner">
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </div>
      <div v-else class="upload-file-card">
        <i :class="isUploading ? 'el-icon-loading' : 'el-icon-document'" />
        <span class="upload-file-card-name" :title="currentFile.name">{{ currentFile.name }}</span>
        <span v-if="isUploading" class="upload-file-card-uploading">导入中，请稍候...</span>
        <span v-else class="upload-file-card-actions">
          <el-button type="text" size="mini" @click.stop="handleReupload">重新上传</el-button>
          <el-button type="text" size="mini" @click.stop="handleRemoveFile">删除</el-button>
        </span>
      </div>
      <div slot="tip" class="el-upload__tip">
        <span>{{ uploadTip }}</span>
      </div>
    </el-upload>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose" size="small">取消</el-button>
      <el-button
        :type="currentFile ? 'primary' : 'info'"
        :loading="isUploading"
        @click="submitFileForm"
        size="small"
      >确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getTemplateCode, importExcelConfirmFile } from '../../api/common';
import { downloadExcel } from '../../utils';
import api from '../../axios';

// 模板未配置大小/行数限制时的兜底上传要求文案
const DEFAULT_UPLOAD_TIP = '只能上传excel文件，且大小不超过20MB';
// 导入任务页（沿用现状 window.open 目标）
const IMPORT_TASK_PAGE_URL = '/service/excelManagement/commonDataProcessExcelImportTask';

// 配置项是否已配置（null/undefined/'' 视为未配置，对应 tip 片段不显示）
function isConfigured (value) {
  return value !== null && value !== undefined && value !== '';
}

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
    },
    // 定制导入接口地址，传入后上传走该接口而非通用导入接口
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
      fileList: [],
      currentFile: null,
      // 模板配置（getTemplateCode 响应扩展：importBusinessName/fileSizeLimitMb/maxRows），用于拼装动态上传要求 tip
      templateInfo: {}
    };
  },
  computed: {
  // 使用计算属性动态获取上传地址
    uploadAction () {
      return (window.APP_AIS_WEB_CONFIG?.VUE_APP_WORK_ORDER_URL || process.env.VUE_APP_WORK_ORDER_URL) + '/file/fileService/uploadMultipartFile';
    },
    // 动态上传要求 tip：按模板配置拼装"支持 .xlsx、.xls ｜ 单文件不超过 XX MB ｜ 单次最多 N 行"，
    // 配置片段为空不显示；大小/行数均未配置时回退兜底文案
    uploadTip () {
      const info = this.templateInfo || {};
      const hasLimit = isConfigured(info.fileSizeLimitMb);
      const hasRows = isConfigured(info.maxRows);
      if (!hasLimit && !hasRows) {
        return DEFAULT_UPLOAD_TIP;
      }
      const parts = ['支持 .xlsx、.xls'];
      if (hasLimit) {
        parts.push(`单文件不超过 ${info.fileSizeLimitMb} MB`);
      }
      if (hasRows) {
        parts.push(`单次最多 ${info.maxRows} 行`);
      }
      return parts.join(' ｜ ');
    },
    // 导入业务名称（/code 响应扩展字段 importBusinessName，兼容 importBusiness）
    templateImportBusiness () {
      const info = this.templateInfo || {};
      return info.importBusinessName || info.importBusiness || '';
    },
    // 实际生效的大小上限（MB）：模板配置优先，未配置回退兜底 20MB（与 uploadTip 兜底口径一致；
    // 仅正数视为配置，口径对齐后端 fileLevelCheck 的 sizeLimitMb > 0 门控）
    effectiveFileSizeLimitMb () {
      const configured = Number((this.templateInfo || {}).fileSizeLimitMb);
      return configured > 0 ? configured : 20;
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler (val) {
        if (val) {
          this.fetchTemplateConfig();
        }
      }
    }
  },
  methods: {
    handleClose () {
      // 关闭即清理上次选择的文件（卡片/内部列表），避免取消后重开弹窗残留旧文件卡片（t7-T7-L2）
      this.resetFile();
      this.$emit('close');
    },
    // 文件选择变化
    handleFileChange (file, fileList) {
      if (fileList.length > 0) {
        this.currentFile = file.raw;
      }
    },
    // limit=1：已选文件后再次选择/拖拽时自动替换旧文件
    handleExceed (files) {
      this.$refs.upload.clearFiles();
      this.$refs.upload.handleStart(files[0]);
    },
    // 重新上传：再次打开系统文件选择器
    handleReupload () {
      const input = this.$refs.upload && this.$refs.upload.$el.querySelector('input[type=file]');
      input && input.click();
    },
    // 删除已选文件
    handleRemoveFile () {
      this.resetFile();
    },
    // 清空已选文件
    resetFile () {
      this.fileList = [];
      this.currentFile = null;
      this.$refs.upload && this.$refs.upload.clearFiles();
    },
    // 打开弹窗时拉取模板配置（getTemplateCode 响应扩展字段）
    // 模板不存在（600 无数据）或接口异常时静默回退兜底 tip，不影响既有上传流程
    async fetchTemplateConfig () {
      if (!this.id) {
        return;
      }
      try {
        const res = await getTemplateCode(this.id);
        this.templateInfo = res || {};
      } catch (error) {
        this.templateInfo = {};
      }
    },
    // 手动上传
    async submitFileForm () {
      if (!this.currentFile) {
        return this.$message.error('请选择文件');
      }
      // 文件校验
      const isExcel = this.currentFile.name.endsWith('.xls') || this.currentFile.name.endsWith('.xlsx');
      // 大小上限按模板配置生效（未配置回退 20MB），与 tip 展示口径一致
      const sizeLimitMb = this.effectiveFileSizeLimitMb;

      if (!isExcel) {
        return this.$message.error('只能上传 .xls / .xlsx 格式的 Excel 文件!');
      }
      if (this.currentFile.size / 1024 / 1024 >= sizeLimitMb) {
        return this.$message.error(`文件大小不能超过 ${sizeLimitMb}MB!`);
      }

      this.isUploading = true;

      try {
        const formData = new FormData();
        formData.append('file', this.currentFile);
        // 最短 loading 展示 600ms：快速响应下保证转圈状态可见，避免一闪而过无反馈；慢请求（如竞速等待）不受影响
        const [res] = await Promise.all([
          this.importFile(formData),
          new Promise(resolve => setTimeout(resolve, 600))
        ]);
        if (this.async) {
          // 显式 :async="true"（存量调用）：保持现状语义，立即提示跳转任务页，组件内不走同步等待竞速
          this.$confirm('正在导入中，是否要跳转"系统管理-文件管理-导入任务"中查看？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            window.open(IMPORT_TASK_PAGE_URL, '_blank');
          }).catch(() => {});
          this.resetFile();
          this.handleClose();
          return;
        }
        if (this.uploadUrl) {
          // uploadUrl 旁路（定制导入接口）：完全现状逻辑，不经通用引擎新契约消化
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
          this.resetFile();
          this.handleClose();
          return;
        }
        // 通用导入：按新契约消化响应（完成结果/文案型返回/任务化返回三形态），
        // 与后端 legacyOnly 回退下的现状语义天然兼容
        this.handleImportResult(res);
      } catch (error) {
        if (this.uploadUrl) {
          // 现状行为：toast + 清理 + 关闭
          this.$message.error('文件上传失败');
          this.resetFile();
          this.handleClose();
        } else {
          // HTTP 异常：报错文案已由 axios 拦截器统一 toast（透传后端 msg），
          // 弹窗不关闭、保留已选文件便于重试
        }
      } finally {
        this.isUploading = false;
      }
    },
    // 通用导入结果消化（技术方案 §4.3）：
    // ① 完成结果：全成功 toast"导入成功"；有失败 toast"成功 X 行，失败 X 行"并 2 秒后自动下载失败文件；emit getData
    // ② 文案型返回（文件级校验失败/MD5 防重留痕，successNum=0 && failNum=0 && failExcelUrl=标准文案）：
    //    仅 toast 后端标准文案，弹窗不关闭、可重新选择文件，不触发下载、不 emit
    // ③ 任务化返回（8s 竞速超时）：data 承载 taskId，提示转导入记录页；确认后仍 emit getData 尽力刷新
    handleImportResult (res) {
      if (!res || typeof res !== 'object') {
        this.$message.error('文件上传失败');
        return;
      }
      // 形态③：data 承载 taskId（完成结果/文案型返回时 data 为空）
      if (isConfigured(res.data)) {
        this.$confirm('导入任务创建成功，请等待系统处理，稍后在导入记录中查看结果', '提示', {
          confirmButtonText: '前往导入记录',
          cancelButtonText: '取消',
          type: 'success'
        }).then(() => {
          window.open(IMPORT_TASK_PAGE_URL, '_blank');
          this.$emit('getData');
        }).catch(() => {
          this.$emit('getData');
        });
        this.resetFile();
        this.handleClose();
        return;
      }
      // 形态②：文案型返回（failExcelUrl 非空且 successNum/failNum 均为 0）
      if (res.failExcelUrl && !Number(res.failNum) && !Number(res.successNum)) {
        this.$message.error(res.failExcelUrl);
        return;
      }
      // 形态①：完成结果
      const successNum = Number(res.successNum || 0);
      const failNum = Number(res.failNum || 0);
      if (failNum > 0) {
        this.$message.warning(`成功 ${successNum} 行，失败 ${failNum} 行`);
        setTimeout(() => {
          downloadExcel(res?.failExcelUrl, res?.fileName || res?.businessType || '模板.xlsx');
        }, 2000);
      } else {
        this.$message.success('导入成功');
      }
      this.$emit('getData');
      this.resetFile();
      this.handleClose();
    },
    // 执行导入请求：定制接口优先，否则走通用导入
    async importFile (formData) {
      const token = localStorage.getItem('token');
      // 顶层字段供通用接口 importExcelConfirmFile 解构，params 供定制接口直接透传
      const queryParams = {
        id: this.id,
        token,
        ...(this.businessParams && { businessParams: this.businessParams }),
        ...(this.async && { async: this.async })
      };
      const config = {
        ...queryParams,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      };
      return this.uploadUrl
        ? await api.postExport(this.uploadUrl, formData, { params: queryParams, ...config })
        : await importExcelConfirmFile(formData, config);
    },
    // 获取接口方法下载模板
    async downloadTemplate () {
      const res = await getTemplateCode(this.id);
      downloadExcel(res?.excelModelUrl, res?.fileName || res?.businessType || '模板.xlsx');
    }
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
    display: flex;
    align-items: center;
    justify-content: center;
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
  // 已选文件卡片：渲染在拖拽选择区域内（替换上传提示），图标/文件名/操作纵向居中排列
  .upload-file-card {
    width: 100%;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    i {
      color: var(--themColor);
      font-size: 48px;
    }
    .upload-file-card-name {
      max-width: 100%;
      margin-top: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }
    .upload-file-card-actions {
      margin-top: 4px;
      .el-button {
        padding: 0 4px;
      }
    }
    .upload-file-card-uploading {
      margin-top: 4px;
      font-size: 12px;
      color: #9d9d9d;
    }
  }
}
</style>
