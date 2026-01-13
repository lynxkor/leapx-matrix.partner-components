<script>
/**
  * 审批弹窗
  * <audit-dialog
  *   ref="auditDialogRef"
  *  :auditTitle="'初审审批'"
  *   @audit="handleAudit"
  * />
  *
  * auditDialogShow () {
  *    this.$refs.auditDialogRef.show();
  *  },
  *  handleAudit () {
  *    this.$refs.auditDialogRef.show();
  *  },
  *
*/
</script>
<template>
  <el-dialog
    :visible.sync="auditShow"
    append-to-body
    :title="auditTitle"
    width="500px"
    @close="close"
  >
    <el-form ref="auditForm" :model="auditForm" :rules="rules">
      <el-form-item
        label="审核"
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
  methods: {
    show () {
      this.auditShow = true;
    },
    close () {
      this.auditShow = false;
      this.auditForm = { remark: '' };
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
          this.$emit('audit', this.auditForm);
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
</style>
