<template>
  <el-form-item label=" " class="form-item-action" :class="{'right': align === 'right'}">
    <el-button v-if="isListPage" size="medium" class="btn-search" @click="openSaveDialog">另存为查询视图</el-button>
    <el-button :loading="Loading" size="medium" class="btn-search" @click="$emit('submit')">查询</el-button>
    <el-button size="medium" class="btn-reset" @click="handleReset">重置</el-button>
    <span v-if="isExpandable" class="icon-expand curPoint" @click="$emit('input', !value)">
      {{ value ? "收起" : "展开"}}
      <i :class="value ? 'iconfont icon-lxppc-up' : 'iconfont icon-lxppc-down'"></i>
    </span>

    <el-dialog
      v-if="isListPage"
      title="另存为查询视图"
      width="420px"
      :visible.sync="pqvDialogVisible"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="pqv-dialog__row">
        <span class="pqv-dialog__label">更新类型</span>
        <el-radio-group v-model="pqvUpdateType" @change="onUpdateTypeChange">
          <el-radio :label="1">新增</el-radio>
          <el-radio :label="2" :disabled="!pqvSelectedId">修改</el-radio>
        </el-radio-group>
      </div>
      <div class="pqv-dialog__row">
        <span class="pqv-dialog__label">查询视图名称</span>
        <el-input
          v-model="pqvViewName"
          maxlength="100"
          show-word-limit
          placeholder="请输入"
        />
      </div>
      <template v-slot:footer>
        <div class="dialog-footer">
          <el-button size="small" @click="pqvDialogVisible = false">取消</el-button>
          <el-button size="small" type="primary" :loading="pqvSaving" @click="handleSave">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </el-form-item>
</template>

<script>
import * as personalQueryViewApi from '@/libs/api/personalQueryView';
import {
  state as personalQueryViewState,
  resolveTableCode,
  register,
  unregister,
  select,
  clearSelection
} from '@/libs/store/personalQueryView';

export default {
  name: 'PageSearchAction',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    isExpandable: {
      type: Boolean,
      default: true
    },
    Loading: {
      type: Boolean,
      default: false
    },
    align: {
      type: String,
    }
  },
  data () {
    return {
      pqvTableCode: '',
      isListPage: false,
      pqvDialogVisible: false,
      pqvUpdateType: 1,
      pqvViewName: '',
      pqvSaving: false
    };
  },
  computed: {
    pqvBucket () {
      return personalQueryViewState.cache[this.pqvTableCode] || null;
    },
    pqvSelectedId () {
      return this.pqvBucket ? this.pqvBucket.selectedId : null;
    },
    pqvSelectedName () {
      return this.pqvBucket ? this.pqvBucket.selectedName : '';
    },
    pqvApplyTick () {
      return this.pqvBucket ? this.pqvBucket.applyTick : 0;
    }
  },
  watch: {
    pqvApplyTick (val) {
      if (!val || !this._pqvActive || this._isDestroyed) return;
      this._lastAppliedTick = val;
      this._applyView(this.pqvBucket && this.pqvBucket.apply);
    },
    // 微前端子应用销毁重建时路由恢复可能晚于组件创建,这里补一次
    $route () {
      if (this._pqvActive && !this.pqvTableCode) this._initPqv();
    }
  },
  created () {
    this._pqvActive = true;
    this._pqvRegistered = false;
    this._pqvInitialized = false;
    this._listFormVm = null;
    this._lastAppliedTick = 0;
    this._pqvCvBizKey = this.$route?.meta?.customViewBizKey || '';
    this.pqvTableCode = resolveTableCode(this.$route);
  },
  mounted () {
    this._initPqv();
  },
  activated () {
    this._pqvActive = true;
    this._initPqv();
    this._drainApply();
  },
  deactivated () {
    this._pqvActive = false;
    this.pqvDialogVisible = false;
    this._unregisterPqv();
  },
  beforeDestroy () {
    this._pqvActive = false;
    const remaining = this._unregisterPqv();
    const count = remaining === null
      ? (personalQueryViewState.cache[this.pqvTableCode]?.registered || 0)
      : remaining;
    // 真正销毁且没有其他同路由实例时,清掉选中态,
    // 避免下次进来出现"标题显示已选视图、表单却是默认值"的错位
    if (count === 0) clearSelection(this.pqvTableCode);
  },
  methods: {
    /**
     * 沿 $parent 链找列表页搜索表单。
     * 只认 .ais-search-form:部分弹窗内部也有 el-form,不能仅凭存在 el-form 判断。
     */
    _findListForm () {
      let vm = this.$parent;
      while (vm) {
        if (vm.$options && vm.$options.name === 'ElForm' &&
          vm.$el && vm.$el.classList && vm.$el.classList.contains('ais-search-form') &&
          vm.model) {
          return vm;
        }
        vm = vm.$parent;
      }
      return null;
    },
    _initPqv () {
      if (!this.pqvTableCode) this.pqvTableCode = resolveTableCode(this.$route);
      if (this._pqvRegistered || !this.pqvTableCode) return;
      const formVm = this._findListForm();
      if (!formVm) return;
      this._listFormVm = formVm;
      this.isListPage = true;
      this._pqvRegistered = true;
      register(this.pqvTableCode);
      // 仅在首次登记时消费历史 tick(页面首次挂载不自动重放上一次的选中视图);
      // keep-alive 重新激活时不能消费,否则隐藏期间收到的 apply 会被吞掉
      if (!this._pqvInitialized) {
        this._pqvInitialized = true;
        const bucket = this.pqvBucket;
        this._lastAppliedTick = bucket ? bucket.applyTick : 0;
      }
    },
    _unregisterPqv () {
      if (!this._pqvRegistered) return null;
      this._pqvRegistered = false;
      return unregister(this.pqvTableCode);
    },
    /** keep-alive 隐藏期间收到的 apply,在重新激活时补执行一次 */
    _drainApply () {
      const bucket = this.pqvBucket;
      if (!bucket || !bucket.applyTick || bucket.applyTick === this._lastAppliedTick || !this._pqvActive) return;
      this._lastAppliedTick = bucket.applyTick;
      this._applyView(bucket.apply);
    },
    _applyView (payload) {
      if (!payload) return;
      if (payload.id === null || payload.id === undefined) {
        // 默认查询视图:交给页面原有重置逻辑(恢复默认值、回到第 1 页并刷新)。
        // 启用了 CustomView 的页面在 onReset 里会自行 resetCustomView,这里不再重复处理。
        this.$emit('reset');
        return;
      }
      // 页面 reset 时可能整体替换 this.form,必须操作时现读
      const model = this._listFormVm && this._listFormVm.model;
      if (!model) return;
      const condition = payload.queryCondition || {};
      // 快照里没有的字段必须清空,否则上一次查询条件会混入本次结果
      Object.keys(model).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(condition, key)) {
          this.$set(model, key, Array.isArray(model[key]) ? [] : undefined);
        }
      });
      Object.keys(condition).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(model, key)) {
          this.$set(model, key, condition[key]);
        }
      });
      // 页面若同时启用了 CustomView,先清掉其选中态,否则业务页 getData 会被 mixin 拦截。
      // 清空动作会触发 mixin 的 onViewChange -> getData(此时表单已写好),无需再 submit。
      if (this._resetCustomViewSelection()) return;
      this.$nextTick(() => {
        if (!this._isDestroyed && this._pqvActive) this.$emit('submit');
      });
    },
    /**
     * 清掉当前页 CustomView 的选中态。
     * @returns {Boolean} 之前是否有选中项(有则 mixin 会自行按当前表单重新取数)
     */
    _resetCustomViewSelection () {
      const cvKey = this._pqvCvBizKey;
      if (!cvKey || !this.$store || !this.$store.state.customView) return false;
      const bucket = this.$store.state.customView.cache[cvKey];
      const active = !!(bucket && bucket.activePresetId);
      if (active) this.$store.commit('customView/RESET_VIEW', cvKey);
      return active;
    },
    handleReset () {
      clearSelection(this.pqvTableCode);
      this.$emit('reset');
    },
    openSaveDialog () {
      const model = this._listFormVm && this._listFormVm.model;
      if (!model) return;
      if (this.pqvSelectedId) {
        this.pqvUpdateType = 2;
        this.pqvViewName = this.pqvSelectedName;
      } else {
        this.pqvUpdateType = 1;
        this.pqvViewName = '';
      }
      this.pqvDialogVisible = true;
    },
    onUpdateTypeChange (val) {
      if (val === 2) {
        if (!this.pqvSelectedId) {
          this.pqvUpdateType = 1;
          return;
        }
        this.pqvViewName = this.pqvSelectedName;
      } else {
        this.pqvViewName = '';
      }
    },
    async handleSave () {
      const model = this._listFormVm && this._listFormVm.model;
      if (!model) return;
      const name = (this.pqvViewName || '').trim();
      if (!name) {
        this.$message.warning('请输入查询视图名称');
        return;
      }
      if (name.length > 100) {
        this.$message.warning('查询视图名称不能超过 100 个字符');
        return;
      }
      const isUpdate = this.pqvUpdateType === 2 && !!this.pqvSelectedId;
      let queryCondition;
      try {
        queryCondition = JSON.parse(JSON.stringify(model));
      } catch (e) {
        this.$message.error('查询条件无法保存,请检查表单数据');
        return;
      }
      this.pqvSaving = true;
      try {
        await personalQueryViewApi.addOrUpdate({
          ...(isUpdate ? { id: this.pqvSelectedId } : {}),
          tableCode: this.pqvTableCode,
          viewName: name,
          updateType: isUpdate ? 2 : 1,
          queryCondition
        });
        if (isUpdate) select(this.pqvTableCode, this.pqvSelectedId, name);
        this.pqvDialogVisible = false;
        this.$message.success(isUpdate ? '已更新查询视图' : '已保存查询视图');
      } catch (e) {
        // axios 拦截器已提示后端错误,保持弹窗打开便于修改
      } finally {
        this.pqvSaving = false;
      }
    }
  }
};
</script>

<style scoped lang="scss">
/* 列表中展开和收起 */
.icon-expand {
  color: var(--aisDefaultTextColor);
  font-size: 14px;
  margin-left: 10px;
  display: inline-block;
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  text-align: center;
  &:hover, &:focus{
    background-color: #F8F7F7;
  }
}
.btn-search{
  border: 1px solid var(--themColor);
  color: var(--themColor);
  font-weight: 400;
  &:hover, &:focus{
    background-color: var(--themColor);
    color: #fff;
  }
}
.btn-reset{
  color: var(--aisDefaultTextColor);
  font-weight: normal;
  font-weight: 400;
  &:hover, &:focus{
    background-color: #fff;
    color: var(--themColor);
    border: 1px solid var(--themColor);
  }
}
.el-form-item.right  {
  ::v-deep .el-form-item__content {
    text-align: right;
  }
}
.pqv-dialog {
  &__row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  &__label {
    width: 96px;
    flex-shrink: 0;
    color: #606266;
    font-size: 13px;
  }
  &__hint {
    padding-left: 96px;
    color: #909399;
    font-size: 12px;
  }
}
.dialog-footer {
  text-align: right;
}
::v-deep .el-form-item__label{
  width: 0px!important;
}
</style>
