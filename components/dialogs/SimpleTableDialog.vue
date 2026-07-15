<template>
  <el-dialog
    class="simple-table-dialog"
    :title="title"
    width="1200px"
    :visible.sync="dialogVisible"
    @close="close"
  >
    <div class="container">
      <slot></slot>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'SimpleTableDialog',
  components: {
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
  },
  data () {
    return {
      dialogVisible: this.visible,
    };
  },
  watch: {
    visible (val) {
      this.dialogVisible = val;
    }
  },
  methods: {
    close () {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
  }
};
</script>

<style lang="scss" scoped>
.simple-table-dialog {
  ::v-deep .vxe-table--render-default .vxe-cell {
    white-space: normal!important;
  }
  ::v-deep .el-dialog{
    margin-top: 80px !important;
    height: calc(100% - 160px) !important;
    display: flex;
    flex-direction: column;
  }
  ::v-deep .el-dialog__body {
    flex: 1;
    max-height: none;
    .container {
      height: 100%;
    }
  }
}
</style>
