<template>
  <el-dialog
    :visible.sync="auditShow"
    append-to-body
    :title="auditTitle"
    width="600px"
    @close="close"
  >
    <el-form ref="auditForm" :model="auditForm" :rules="rules" label-width="80px" size="small" style="padding: 10px 0">
      <el-form-item
        v-if="auditDataList && auditDataList.length > 0"
        :label="auditDataList && auditDataList.length > 1 ? '批量审核数据' : '审核数据'"
        prop="auditor"
      >
        <el-tooltip
          :display="auditDataList && auditDataList.length > 0"
          :content="tooltipContent"
          placement="top"
        >
          <span>{{ displayAuditData }}</span>
        </el-tooltip>
      </el-form-item>
      <el-form-item
        label="审核结果"
        prop="result"
      >
        <el-radio-group v-model="auditForm.result">
          <el-radio :label="1">通过</el-radio>
          <el-radio :label="0">不通过</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        label="审核说明"
        prop="remark"
        :rules="!auditForm.result ? rules.remark : []"
      >
        <el-input
          v-model="auditForm.remark"
          :rows="4"
          maxlength="500"
          placeholder="审核说明"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="close"> 取消 </el-button>
      <el-button type="primary" @click="auditFun"> 确定 </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'AuditDialog',
  props: {
    auditTitle: {
      type: String,
      default: '审批'
    },
    auditDataList: {
      type: Array,
      default: () => []
    },
    field: {
      type: String,
      default: 'id'
    }
  },
  data () {
    return {
      auditShow: false,
      auditForm: {
        result: '',
        remark: ''
      },
      rules: {
        result: [
          { required: true, message: '请选择审核结果', trigger: 'change' }
        ],
        remark: [
          { required: true, message: '请输入审核说明', trigger: 'blur' }
        ]
      }
    };
  },
  computed: {
    displayAuditData () {
      if (!this.auditDataList || this.auditDataList.length === 0) {
        return '';
      }
      // 如果只有一条数据，直接显示该字段值
      if (this.auditDataList.length === 1) {
        return this.auditDataList[0][this.field] || '';
      }
      // 如果有多条数据，显示数量
      return `共 ${this.auditDataList.length} 条数据`;
    },
    tooltipContent () {
      if (!this.auditDataList || this.auditDataList.length === 0) {
        return '';
      }
      return this.auditDataList
        .map(item => item[this.field] || '')
        .filter(value => value)
        .join(', ');
    }
  },
  methods: {
    show () {
      this.auditShow = true;
    },
    close () {
      this.auditShow = false;
      this.auditForm = { result: '', remark: '' };
      this.$nextTick(() => {
        this.$refs.auditForm.clearValidate();
      });
    },
    /**
     * 审核操作
     */
    auditFun () {
      this.$refs.auditForm.validate((valid) => {
        if (valid) {
          // 将审核数据列表也传递给父组件
          this.$emit('audit', { ...this.auditForm, auditDataList: this.auditDataList });
          this.close();
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
::v-deep .el-dialog .el-dialog__body {
  padding: 0 20px !important;
}
::v-deep .el-form-item {
  margin-bottom: 10px;
}
</style>
