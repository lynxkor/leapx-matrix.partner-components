<!-- 审核日志组件 -->
<!-- 调用方式： this.$auditLog.show({ id: 123 }); -->
<template>
  <el-dialog
    class="m-AuditLog-dialog"
    title="审核日志"
    :visible.sync="dialogVisible"
    width="1200px"
    :before-close="handleClose"
    append-to-body
  >
    <vxe-table
      :data="tableData"
      :merge-cells="mergeCells"
      border="inner"
      stripe
      resizable
      size="medium"
      keep-source
      :header-cell-config="{height: 40}"
      min-height="360px"
      max-height="700px"
    >
      <vxe-column field="operationTime" title="更改日期"></vxe-column>
      <vxe-column field="operatorName" title="更改者"></vxe-column>
      <vxe-column field="operationType" title="事件"></vxe-column>
      <vxe-column field="changedFieldsLine" title="已更改字段"></vxe-column>
      <vxe-column field="oldValuesLine" title="旧值"></vxe-column>
      <vxe-column field="newValuesLine" title="新值"></vxe-column>
      <!-- 可根据实际数据结构添加更多列 -->
    </vxe-table>
  </el-dialog>
</template>

<script>
import api from '@/axios';

export default {
  name: 'AuditLogDialog',
  data () {
    return {
      dialogVisible: false,
      loading: false,
      tableData: [],
      currentId: null,
      mergeCells: []
    };
  },
  watch: {
    dialogVisible (val) {
      if (val && this.currentId) {
        this.fetchAuditLogData();
      }
    }
  },
  methods: {
    show (options = {}) {
      this.currentId = options.id;
      this.dialogVisible = true;
    },

    handleClose () {
      this.dialogVisible = false;
      this.tableData = [];
      this.currentId = null;
    },

    async fetchAuditLogData () {
      this.loading = true;
      try {
        const res = await this.getAuditLogList({ recordId: '00076D98-6575-EF11-B197-FA9152FF2813' });
        const tableData = res || [];
        const target = [];
        let rows = 0;
        // 数据拆分行
        for (let i = 0; i < tableData.length; i++) {
          const item = tableData[i];
          const { changedFields = [], oldValues, newValues, ...rest } = item;
          this.mergeCells.push({ row: rows, col: 0, rowspan: changedFields.length, colspan: 1 });
          this.mergeCells.push({ row: rows, col: 1, rowspan: changedFields.length, colspan: 1 });
          this.mergeCells.push({ row: rows, col: 2, rowspan: changedFields.length, colspan: 1 });
          rows += changedFields.length;
          for (let j = 0; j < changedFields.length; j++) {
            const field = changedFields[j];
            const row = {
              ...rest,
              changedFieldsLine: field,
              oldValuesLine: oldValues[j],
              newValuesLine: newValues[j]
            };
            target.push(row);
          }
        }
        this.tableData = target;
        this.loading = false;
      } catch (error) {
        console.error('获取审核日志失败:', error);
        this.tableData = [];
        this.loading = false;
      }
    },

    getAuditLogList (data) {
      return api.jsonPost('/datareport/web/log/auditLog/list', data);
    },
  }
};
</script>
