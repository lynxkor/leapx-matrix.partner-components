<script>
/**
 * AisAttachmentList - 附件列表展示组件（表格形式）
 * @description 用于展示附件列表，支持分页、查看、下载、删除等操作
 *
 * @property {string|number} businessId - 业务 ID（与 businessIdList 互斥，二选一必填）
 * @property {array} businessIdList - 业务 ID 列表（与 businessId 互斥，二选一必填）
 * @property {string} attachType - 附件类型（可选）
 * @property {array} attachTypeList - 附件类型列表（可选）
 * @property {boolean} readonly - 是否只读，默认 false
 * @property {boolean} showPagination - 是否显示分页，默认 true
 * @property {number} pageSize - 每页数量，默认 10
 *
 * @event delete-success - 删除成功时触发，返回被删除的文件信息
 * @event download - 下载时触发，返回文件信息
 * @event preview - 预览时触发，返回文件信息
 *
 * @example
 * <!-- 基本用法：使用 businessId -->
 * <AisAttachmentList
 *   :businessId="businessId"
 * />
 *
 * <!-- 使用 businessIdList -->
 * <AisAttachmentList
 *   :businessIdList="[id1, id2]"
 *   attachType="xxx"
 *   @delete-success="handleDelete"
 * />
 *
 * <!-- 只读模式 -->
 * <AisAttachmentList
 *   :businessId="businessId"
 *   attachType="xxx"
 *   :readonly="true"
 * />
 *
 * <!-- 隐藏分页 -->
 * <AisAttachmentList
 *   :businessId="businessId"
 *   attachType="xxx"
 *   :show-pagination="false"
 * />
 */
</script>

<template>
  <div class="ais-attachment-list" v-loading="loading">
    <!-- 表格 -->
    <vxe-table
      ref="tableRef"
      :data="tableData"
      stripe
      border="inner"
      resizable
      :header-cell-class-name="'attachment-table-header'"
      show-overflow
      size="medium"
    >
      <vxe-column field="fileName" title="附件名称" min-width="280">
        <template #default="{ row, rowIndex }">
          <div class="file-name-cell">
            <el-image
              v-if="isImageType(row.fileType)"
              :src="row.fileUrl"
              :preview-src-list="[row.fileUrl]"
              class="file-icon-img"
              fit="contain"
            />
            <img v-else-if="getFileIcon(row.fileType)" :src="getFileIcon(row.fileType)" class="file-icon-img" />
            <template v-if="editingIndex === rowIndex">
              <el-input
                v-model="editFileName"
                size="small"
                class="edit-input"
                @blur="handleInputBlur"
                @keydown.enter.native.prevent="confirmEdit(row)"
              />
            </template>
            <template v-else>
              <span :title="row.fileName">{{ row.fileName }}</span>
            </template>
          </div>
        </template>
      </vxe-column>

      <vxe-column field="creatorName" title="操作人" width="120" align="center">
        <template #default="{ row }">
          {{ row.creatorName || '-' }}
        </template>
      </vxe-column>

      <vxe-column field="fileSize" title="附件大小 (KB)" width="140" align="center">
        <template #default="{ row }">
          {{ row.fileSize }}
        </template>
      </vxe-column>

      <vxe-column field="createTime" title="创建时间" width="180" align="center">
        <template #default="{ row }">
          {{ row.createTime }}
        </template>
      </vxe-column>

      <vxe-column title="操作" width="300" align="center" fixed="right">
        <template #default="{ row, rowIndex }">
          <template v-if="editingIndex === rowIndex">
            <el-button type="text" size="small" class="btn-confirm" @click="confirmEdit(row)">确认</el-button>
            <el-button type="text" size="small" @click="cancelEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button v-if="!readonly" type="text" size="small" class="btn-edit" @click="startEdit(row, rowIndex)">编辑</el-button>
            <el-button type="text" size="small" @click="handleDownload(row)">下载</el-button>
            <el-popconfirm
              v-if="!readonly"
              title="确定删除该图片吗？"
              confirm-button-class="btn-delete-confirm"
              @confirm="handleDelete(row)"
            >
              <el-button slot="reference" type="text" size="small" class="btn-delete">
                删除
              </el-button>
            </el-popconfirm>
          </template>
        </template>
      </vxe-column>
    </vxe-table>

    <!-- 分页 -->
    <el-pagination
      v-if="showPagination"
      class="pagination"
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import { getFileListPage, deleteFile, addOrUpdateFile } from '../../api/attachment/index.js';

export default {
  name: 'AisAttachmentList',

  props: {
    // 业务 ID（与 businessIdList 互斥，二选一必填）
    businessId: {
      type: [String, Number],
      default: ''
    },

    // 业务 ID 列表（与 businessId 互斥，二选一必填）
    businessIdList: {
      type: Array,
      default: null
    },

    // 附件类型（可选）
    attachType: {
      type: String,
      default: ''
    },

    // 附件类型列表（可选）
    attachTypeList: {
      type: Array,
      default: null
    },

    // 是否只读
    readonly: {
      type: Boolean,
      default: false
    },

    // 是否显示分页
    showPagination: {
      type: Boolean,
      default: true
    },

    // 每页数量
    pageSize: {
      type: Number,
      default: 10
    },
  },

  data() {
    return {
      loading: false,
      searchForm: {
        fileName: ''
      },
      tableData: [],
      pagination: {
        page: 1,
        pageSize: this.pageSize,
        total: 0
      },
      // 编辑状态
      editingIndex: -1,
      editFileName: ''
    };
  },

  computed: {
    // 实际使用的业务 ID（businessIdList 优先级高于 businessId）
    actualBusinessId() {
      return this.businessIdList || this.businessId;
    },

    // 实际使用的附件类型（attachTypeList 优先级高于 attachType）
    actualAttachType() {
      return this.attachTypeList || this.attachType;
    }
  },

  watch: {
    actualBusinessId: {
      handler() {
        if (this.actualBusinessId) {
          this.init();
        }
      },
      immediate: true
    }
  },

  methods: {
    // 初始化
    async init() {
      if (!this.actualBusinessId) {
        return;
      }

      await this.loadData();
    },

    // 加载数据
    async loadData() {
      if (!this.actualBusinessId) return;

      this.loading = true;
      try {
        const params = {
          pageNum: this.pagination.page,
          pageSize: this.pagination.pageSize
        };

        // attachType 有值时才传入
        if (this.actualAttachType) {
          params.attachType = this.actualAttachType;
        }

        // 根据传入的参数类型决定使用 businessId 还是 businessIdList
        if (Array.isArray(this.actualBusinessId)) {
          params.businessIdList = this.actualBusinessId;
        } else {
          params.businessId = this.actualBusinessId;
        }

        if (this.searchForm.fileName) {
          params.fileName = this.searchForm.fileName;
        }

        const res = await getFileListPage(params);

        if (res) {
          // 分页响应格式：{ rows: [], total: 0 }
          if (res.records) {
            this.tableData = res.records;
            this.pagination.total = res.total || 0;
          } else if (Array.isArray(res)) {
            // 非分页情况（数组直接返回）
            this.tableData = res;
            this.pagination.total = res.length;
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        this.tableData = [];
      } finally {
        this.loading = false;
      }
    },

    // 分页变化
    handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.pagination.page = 1;
      this.loadData();
    },

    handleCurrentChange(page) {
      this.pagination.page = page;
      this.loadData();
    },

    // 开始编辑
    startEdit(row, index) {
      this.editingIndex = index;
      // 分离文件名和后缀
      const fileName = row.fileName;
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        this.editFileName = fileName.substring(0, lastDotIndex);
      } else {
        this.editFileName = fileName;
      }
    },

    // 确认编辑
    async confirmEdit(row) {
      if (!this.editFileName.trim()) {
        this.$message.info('文件名不能为空');
        return;
      }

      try {
        // 获取原文件后缀
        const fileName = row.fileName;
        const lastDotIndex = fileName.lastIndexOf('.');
        const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

        // 调用接口更新文件名
        await addOrUpdateFile({
          id: row.id,
          fileName: this.editFileName.trim() + extension
        });

        this.$message.success('重命名成功');
        this.editingIndex = -1;
        this.loadData();
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('重命名失败');
        }
      }
    },

    // 取消编辑
    cancelEdit() {
      this.editingIndex = -1;
      this.editFileName = '';
    },

    // 输入框失去焦点（不取消编辑，防止误操作）
    handleInputBlur() {
      // 不执行任何操作，防止点击确认/取消时触发
    },

    // 下载（参考 FileDisplay 的 handleDownload）
    async handleDownload(row) {
      const { fileUrl, fileName } = row;

      try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

        this.$emit('download', {
          id: row.id,
          name: fileName,
          url: fileUrl
        });
      } catch (error) {
        console.error('下载失败:', error);
        // 降级方案：直接打开
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },

    // 删除（参考 deleteConfig 的调用方式）
    async handleDelete(row) {
      try {
        // 删除接口传入数组
        await deleteFile([row.id]);

        this.$message.success('删除成功');
        this.$emit('delete-success', {
          id: row.id,
          name: row.fileName
        });

        // 重新加载数据
        if (this.tableData.length === 1 && this.pagination.page > 1) {
          this.pagination.page--;
        }
        this.loadData();
      } catch (error) {
        console.error('删除失败:', error);
      }
    },

    // 格式化文件大小为 KB
    formatFileSizeKB(bytes) {
      if (!bytes) return '';
      return Math.round(bytes / 1024);
    },

    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    },

    // 判断是否为图片类型（可预览）
    isImageType(fileType) {
      const type = (fileType || '').toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(type);
    },

    // 获取文件图标（返回图片路径）
    getFileIcon(fileType) {
      const iconMap = {
        pdf: require('../AisAttachment/icon/pdf.png'),
        xls: require('../AisAttachment/icon/xls.png'),
        xlsx: require('../AisAttachment/icon/xls.png'),
        ppt: require('../AisAttachment/icon/ppt.png'),
        pptx: require('../AisAttachment/icon/ppt.png'),
        doc: require('../AisAttachment/icon/word.png'),
        docx: require('../AisAttachment/icon/word.png'),
        mp4: require('../AisAttachment/icon/video.png'),
        avi: require('../AisAttachment/icon/video.png'),
        zip: require('../AisAttachment/icon/zip.png'),
        rar: require('../AisAttachment/icon/zip.png')
      };
      const type = (fileType || '').toLowerCase();
      return iconMap[type] || require('../AisAttachment/icon/text.png');
    },

    // 刷新列表（外部调用）
    refresh() {
      this.pagination.page = 1;
      this.loadData();
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/libs/assets/styles/variables.scss';

.ais-attachment-list {
  padding: 20px 0;
  background: #fff;
  border-radius: 4px;

  .search-form {
    margin-bottom: 16px;
  }

  .pagination {
    margin-top: 16px;
    text-align: right;
  }

  ::v-deep .vxe-table {
    th {
      background-color: #f5f5f5;
      color: #666;
      font-weight: 500;
    }

    .vxe-body--row {
      &:hover {
        background-color: #f5f7fa;
      }
    }

    .file-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .file-icon-img {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }

      .edit-input {
        width: 280px;
      }
    }

    .btn-delete {
      color: var(--leap-color-danger);
    }

    .btn-confirm {
      color: var(--leap-color-success);
    }
  }
}

// 删除确认弹窗样式
::v-deep .btn-delete-confirm {
  background-color: var(--leap-color-danger) !important;
  border-color: var(--leap-color-danger) !important;
}
::v-deep .btn-delete {
  color: var(--leap-color-danger) !important;
}
</style>
