<template>
  <el-form-item label=" " class="form-item-action" :class="{'right': align === 'right'}">
    <el-button :loading="Loading" size="medium" class="btn-search" @click="$emit('submit')">查询</el-button>
    <el-button v-if="isListPage" size="medium" class="btn-search" @click="openSaveDialog">另存为查询视图</el-button>
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
  scopeCode,
  isEnabled,
  register,
  unregister,
  select,
  setActiveScope,
  clearSelection,
  clearSelectionByBase
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
    },
    // 多 tab 页面的视图作用域(如 activeName):每个 tab 独立分桶,单 tab 页面不传
    viewScope: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      pqvBaseCode: '',
      isListPage: false,
      pqvDialogVisible: false,
      pqvUpdateType: 1,
      pqvViewName: '',
      pqvSaving: false
    };
  },
  computed: {
    // 完整桶键 = base + scope 后缀。base 是 created 时锁定的路由编码(keep-alive
    // 缓存页不跟随全局 $route),scope 跟随页面当前 tab,变化时本组件自行换登记桶
    pqvTableCode () {
      return scopeCode(this.pqvBaseCode, this.viewScope);
    },
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
      // 只有「当前登记桶内真实自增的 tick」才重放。pqvTableCode 切桶也会让 computed
      // 值变化(读到的是新桶的历史 tick),那种变化交给 viewScope watcher 恢复,
      // 这里只消费,否则切 tab 会隐式重放旧视图并与页面自身查询产生请求竞态
      if (this._pqvRegisteredScope === this.pqvTableCode && val > this._lastAppliedTick) {
        this._lastAppliedTick = val;
        this._applyView(this.pqvBucket && this.pqvBucket.apply);
      } else {
        this._lastAppliedTick = val;
      }
    },
    // 切 tab:换登记桶、把标题栏切到新 scope,并恢复该 tab 的视图状态——
    // 有选中视图则重放(回显表单并触发带条件的查询),默认视图则交给页面
    // 自身的 tab 切换重置逻辑(其行为就是重置表单 + 无条件查询,语义一致)
    viewScope () {
      if (!this._pqvActive) return;
      this._unregisterPqv();
      this._initPqv();
      const bucket = this.pqvBucket;
      this._lastAppliedTick = bucket ? bucket.applyTick : 0;
      if (bucket && bucket.apply &&
        bucket.selectedId !== null && bucket.selectedId !== undefined) {
        this._applyView(bucket.apply);
      }
    },
    // 微前端子应用销毁重建时路由恢复可能晚于组件创建,这里补一次
    $route () {
      if (this._pqvActive && !this.pqvBaseCode) this._initPqv();
    }
  },
  created () {
    this._pqvActive = true;
    this._pqvRegistered = false;
    this._pqvRegisteredScope = null;
    this._pqvInitialized = false;
    this._listFormVm = null;
    this._lastAppliedTick = 0;
    this._pqvCvBizKey = this.$route?.meta?.customViewBizKey || '';
    this.pqvBaseCode = resolveTableCode(this.$route);
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
    // 真正销毁且没有其他同路由实例时,按 base 清掉所有 scope 的选中态,
    // 避免下次进来出现"标题显示已选视图、表单却是默认值"的错位
    if (count === 0) clearSelectionByBase(this.pqvBaseCode);
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
      if (!this.pqvBaseCode) this.pqvBaseCode = resolveTableCode(this.$route);
      // 微前端路由恢复晚于组件创建时,created 期的 CustomView 桶键捕获会落空,
      // 这里只补空:否则启用 CustomView 的页面选通用视图时清不掉其选中态,
      // 业务页 getData 仍被 fetchByCustomView 拦截走旧视图取数
      if (!this._pqvCvBizKey) this._pqvCvBizKey = this.$route?.meta?.customViewBizKey || '';
      if (this._pqvRegistered || !this.pqvTableCode) return;
      // 路由 meta.personalQueryView === false 的页面关闭该功能:不登记、不显示按钮
      if (!isEnabled(this.$route)) return;
      const formVm = this._findListForm();
      if (!formVm) return;
      this._listFormVm = formVm;
      this.isListPage = true;
      this._pqvRegistered = true;
      this._pqvRegisteredScope = this.pqvTableCode;
      register(this.pqvTableCode);
      // 回写当前激活 scope,标题栏的 GenericView 据此渲染对应 tab 的视图列表
      setActiveScope(this.pqvBaseCode, this.viewScope);
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
      // 用登记时记录的完整桶键注销:切 tab 后 pqvTableCode 已是新 scope
      return unregister(this._pqvRegisteredScope || this.pqvTableCode);
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
        this._emitViewRefresh('reset');
        return;
      }
      // 页面 reset 时可能整体替换 this.form,必须操作时现读
      const model = this._listFormVm && this._listFormVm.model;
      if (!model) return;
      const condition = payload.queryCondition || {};
      // 快照里没有的字段必须清空,否则上一次查询条件会混入本次结果。
      // 绝不能置 undefined:多数列表页 getFormData 里有 data[key].length,
      // 会在 getData 里同步抛 TypeError,而 loading 已置 true、复位的 .finally
      // 挂在尚未建立的 Promise 链上 -> 请求发不出去且整页遮罩卡死。
      // 用类型化空值(数组 -> [],其余 -> '')既保留字段与响应式,又会被
      // 各页 getFormData 的 ''/[] 过滤掉,不会污染请求参数。
      Object.keys(model).forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(condition, key)) {
          this.$set(model, key, Array.isArray(model[key]) ? [] : '');
        }
      });
      Object.keys(condition).forEach(key => {
        // 不要求 model 已有该 key:tab 切换重置后 form 只剩 defaultForm 声明的字段,
        // 快照里的 tab 专属字段(v-if 显示)必须补写回来,$set 保证新增 key 响应式
        this.$set(model, key, condition[key]);
      });
      // 页面若同时启用了 CustomView,先清掉其选中态,否则业务页 getData 会被 mixin 拦截。
      // 清空动作会触发 mixin 的 onViewChange -> getData(此时表单已写好),无需再 submit。
      if (this._resetCustomViewSelection()) return;
      this.$nextTick(() => {
        if (!this._isDestroyed && this._pqvActive) this._emitViewRefresh('submit');
      });
    },
    /**
     * 触发页面取数并兜住同步异常。
     * 列表页普遍是「loading=true -> 同步构造参数 -> 请求.finally 复位」,
     * 参数构造抛错时 .finally 永远到不了,这里把 loading 复位避免遮罩卡死。
     */
    _emitViewRefresh (event) {
      try {
        this.$emit(event);
      } catch (e) {
        let vm = this.$parent;
        while (vm && typeof vm.loading !== 'boolean') vm = vm.$parent;
        if (vm) vm.loading = false;
        console.error('[查询视图] 页面取数失败:', e);
        this.$message.error('查询失败,请检查查询条件');
      }
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
      this._emitViewRefresh('reset');
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
        // JSON.stringify 会静默丢弃值为 undefined 的字段,导致快照字段集合
        // 少于当前表单;应用视图时这些「缺失字段」只能靠猜类型清空,历史视图
        // 尤其容易踩到。保存前先把 undefined 规范化成空串(万能空值:各页
        // getFormData 都会过滤 '',数组类控件也能容忍),让快照字段集合完整。
        const normalized = {};
        Object.keys(model).forEach(key => {
          const value = model[key];
          normalized[key] = value === undefined ? '' : value;
        });
        queryCondition = JSON.parse(JSON.stringify(normalized));
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
