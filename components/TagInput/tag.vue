<template>
  <div class="tag">
    <div class="content"> <slot /></div>
    <div class="close" v-if="closable"><i class="el-tag__close el-icon-close" @click.stop="handleClose" /></div>
  </div>
</template>
<script>
export default {
  props: {
    closable: {
      type: Boolean,
      default: true
    }
  },
  name: 'Tag',
  methods: {
    handleClose () {
      this.$emit('close');
    }
  }
};
</script>

<style scoped lang="scss">
.tag {
  width: fit-content;
  display: flex;
  border-radius: 4px;
  box-sizing: border-box;
  white-space: nowrap;
  font-size: 12px;
  height: 30px;
  padding:0 8px;
  justify-content: space-between;
  align-items: center;
  margin: 2px;
  background-color: #F8F7F7;
  border: 0;
  border-radius: 4px;
  color: var(--aisDefaultTextColor);
  .content {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .close {
    margin-left: 6px;
    text-align: center;
    width: 16px;
    height: 16px;
    line-height: 16px;
    cursor: pointer;
    :hover {
      border-radius: 50%;
      width: 16px;
      height: 16px;
      line-height: 16px;
    }
  }
}
</style>
