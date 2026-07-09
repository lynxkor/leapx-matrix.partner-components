<!--
  拷贝组件
  在原内容后方显示拷贝图标，点击复制到系统剪贴板并提示"复制成功"

  直接显示值
  <LPCopy :value="form.vin" />

  通过slot注入内容（如 el-link）
  <LPCopy :value="form.vehProfileVin">
    <el-link type="success" @click.prevent="goToVehicleProfile(form.vehProfileId)">{{ form.vehProfileVin }}</el-link>
  </LPCopy>
-->

<template>
  <div class="lp-copy-container">
    <slot>{{ value }}</slot>
    <i v-if="value != null && value !== ''" class="el-icon-document-copy lp-copy-icon" @click="handleCopy"></i>
  </div>
</template>

<script>
import { copyText } from '@/libs/utils/clipboard';

export default {
  name: 'LPCopy',
  props: {
    // 需要复制的文本
    value: {
      type: [String, Number],
      default: ''
    }
  },
  methods: {
    handleCopy () {
      copyText(this.value).then(ok => {
        if (ok) {
          this.$message.success('复制成功');
        } else {
          this.$message.error('复制失败');
        }
      });
    }
  }
};
</script>

<style scoped>
.lp-copy-container {
  display: inline-flex;
  align-items: center;
  .lp-copy-icon {
    cursor: pointer;
    color: var(--themColor);
    font-size: 14px;
    margin-left: 4px;
  }
}
</style>
