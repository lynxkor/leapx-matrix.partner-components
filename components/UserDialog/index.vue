<!--
  用户信息弹框（公用）
  调用方式： this.$userDialog.show({ userId: 'xxx' });
-->
<template>
  <el-dialog
    class="m-UserDialog"
    title="用户信息"
    :visible.sync="dialogVisible"
    width="960px"
    :before-close="handleClose"
    append-to-body
  >
    <div v-loading="loading" class="user-dialog-body">
      <!-- 基础信息：姓名 / 手机号 / 邮箱（三等分展示） -->
      <div class="user-basic">
        <div class="user-basic-item">
          <div class="user-basic-label">姓名</div>
          <div class="user-basic-value">{{ detail.username || '' }}</div>
        </div>
        <div class="user-basic-item">
          <div class="user-basic-label">手机号</div>
          <div class="user-basic-value">{{ detail.mobile || '' }}</div>
        </div>
        <div class="user-basic-item">
          <div class="user-basic-label">邮箱</div>
          <div class="user-basic-value">{{ detail.email || '' }}</div>
        </div>
      </div>

      <!-- 岗位列表 -->
      <el-table
        :data="detail.orgPostUserList || []"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orgName" label="组织部门" min-width="240" />
        <el-table-column prop="postName" label="所属岗位" min-width="200" />
        <el-table-column prop="isMainLabel" label="是否主岗位" width="120" align="center" />
      </el-table>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="handleClose">确认</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getUserDetailById } from '@/libs/api/common';

export default {
  name: 'UserDialog',
  data () {
    return {
      dialogVisible: false,
      loading: false,
      currentUserId: null,
      detail: {
        username: '',
        mobile: '',
        email: '',
        orgPostUserList: []
      }
    };
  },
  watch: {
    dialogVisible (val) {
      if (val && this.currentUserId) {
        this.fetchDetail();
      }
    }
  },
  methods: {
    show (options = {}) {
      this.currentUserId = options.userId;
      this.dialogVisible = true;
    },
    handleClose () {
      this.dialogVisible = false;
      this.detail = { username: '', mobile: '', email: '', orgPostUserList: [] };
      this.currentUserId = null;
    },
    async fetchDetail () {
      this.loading = true;
      try {
        const res = await getUserDetailById(this.currentUserId);
        const list = (res && res.orgPostUserList) || [];
        this.detail = {
          username: res && res.username,
          mobile: res && res.mobile,
          email: res && res.email,
          orgPostUserList: list.map(item => ({
            ...item,
            isMainLabel: String(item && item.position) === '1' ? '是' : '否'
          }))
        };
      } catch (error) {
        console.error('[UserDialog] 获取用户详情失败:', error);
        this.detail = { username: '', mobile: '', email: '', orgPostUserList: [] };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped lang="scss">
.user-dialog-body {
  min-height: 200px;
}
.user-basic {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.user-basic-item {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  min-width: 0;
}
.user-basic-label {
  color: var(--leap-color-default-light-2);
  font-size: 12px;
  margin-bottom: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 8px;
}
.user-basic-value {
  color: var(--leap-color-default);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
</style>
