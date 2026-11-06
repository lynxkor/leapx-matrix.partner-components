<template>
  <!--
    自定义表格配置(内容块形态,不自带弹窗外壳与 footer)。

    用途:视图的「表格设置」——列显隐 + 列顺序 + 基础设置(折行/紧凑度/操作列固定)。
    与 design 包 optionModal.vue 的差异(仅此两点,功能等价):
      1. 渲染为普通内容块(取消/保存由外层弹窗统一提供);
      2. 支持 v-model 双向绑定表格配置(原组件是 submit 事件抛出)。

    常量直接取自 @leapmotor/design/packages/table/constants —— libs 是主仓
    src/ 下的 submodule,编译时走主仓依赖,design 包可用,无需复制常量定义。
  -->
  <div class="c-ts">
    <template v-if="showBaseSettings">
      <p class="c-ts__header">基础设置</p>
      <el-form ref="form" :model="form" label-width="100px">
        <el-form-item label="表格内容折行" prop="autoWrap">
          <el-switch v-model="form.autoWrap" /><span>（开启后页面内容将换行显示完整）</span>
        </el-form-item>
        <el-form-item label="表格紧凑度" prop="layout">
          <el-radio-group v-model="form.layout">
            <el-radio
              v-for="item of LAYOUTS"
              :key="item.value"
              :label="item.value"
              name="layout"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="操作列固定" prop="isOperateFixed">
          <el-switch v-model="form.isOperateFixed" /><span>（开启后操作列在右边固定展示）</span>
        </el-form-item>
      </el-form>
    </template>

    <p class="c-ts__header">自定义显示列<em>下方表头字段会按照从左往右，从上往下的排序逻辑排布</em></p>
    <div class="c-ts__search">
      <el-input
        v-model="colLabel"
        size="mini"
        clearable
        prefix-icon="el-icon-search"
        placeholder="搜索列名称"
      />
    </div>
    <div class="c-ts__multi-cols">
      <span>批量控制</span>
      <el-checkbox v-model="checkAll" :indeterminate="isCheckIndeterminate" @change="handleCheckAllChange">全部显示</el-checkbox>
      <el-checkbox v-model="notCheckAll" :indeterminate="isNoCheckIndeterminate" @change="handleNotCheckAllChange">全部隐藏</el-checkbox>
    </div>
    <div class="c-ts__cols">
      <el-checkbox-group v-model="checkedCols" @change="handleCheckedColsChange">
        <div ref="grid" class="c-ts__grid">
          <div v-for="col in filteredCols" :key="col.props" class="c-ts__grid-item">
            <svg class="c-ts__move-icon" aria-hidden="true">
              <use xlink:href="#icon-leapmotor-design-move"></use>
            </svg><el-checkbox :key="col.props" :label="col.props" :disabled="col.disabled">{{ col.label }}</el-checkbox>
          </div>
        </div>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script>
import Sortable from 'sortablejs';
import { LAYOUTS, COL_TYPE_OPERATE } from '@leapmotor/design/packages/table/constants';

export default {
  name: 'CustomViewTableSetting',
  props: {
    /**
     * 表格配置:{ autoWrap, layout, columnConfig:[{props,label,visible,disabled,type}], isOperateFixed }
     */
    value: {
      type: Object,
      default: () => ({
        autoWrap: false,
        layout: 3,
        columnConfig: [],
        isOperateFixed: true
      })
    },
    /**
     * 是否显示「基础设置」区块。
     *
     * <p>底层表格组件若不支持这三项(如 EditTable 写死了 show-overflow 与行高),
     * 传 false 隐藏该区块,避免出现「设了不生效」。</p>
     */
    showBaseSettings: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      form: {
        autoWrap: false,
        layout: 3,
        columnConfig: [],
        isOperateFixed: true
      },
      LAYOUTS,
      colLabel: '',
      checkAll: false,
      notCheckAll: false,
      isCheckIndeterminate: true,
      isNoCheckIndeterminate: true,
      checkedCols: [],
      COL_TYPE_OPERATE
    };
  },
  computed: {
    filteredCols () {
      return this.form.columnConfig.filter(item => {
        return item.type !== COL_TYPE_OPERATE &&
          item.label.toLowerCase().indexOf(this.colLabel.toLowerCase()) !== -1;
      });
    }
  },
  watch: {
    value: {
      deep: true,
      handler () {
        this.init();
      }
    }
  },
  mounted () {
    this.init();
    this.$nextTick(() => this.initSortable());
  },
  methods: {
    /**
     * 用外部传入的配置初始化表单(列显隐状态同步到勾选组)。
     */
    init () {
      const columnConfig = Array.isArray(this.value.columnConfig) ? this.value.columnConfig : [];
      this.form = {
        autoWrap: this.value.autoWrap,
        layout: this.value.layout,
        columnConfig: columnConfig.map(item => ({ ...item })),
        isOperateFixed: this.value.isOperateFixed
      };
      this.checkedCols = columnConfig.filter(item => item.visible).map(item => item.props);
      this.updateCheck();
    },
    /**
     * 列顺序拖拽排序(仅在可见列子集内调整,隐藏列保持原位置)。
     */
    initSortable () {
      const grid = this.$refs.grid;
      if (!grid) return;
      if (this.sortable) this.sortable.destroy();
      this.sortable = new Sortable(grid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          // 1. 取当前可见列(参与排序的列)
          const visibleCols = [...this.filteredCols];
          // 2. 在可见列子集中调整顺序
          const movedItem = visibleCols.splice(oldIndex, 1)[0];
          visibleCols.splice(newIndex, 0, movedItem);
          // 3. 重建完整数组:隐藏列保持原位置
          const newColumnConfig = [];
          let visibleIndex = 0;
          this.form.columnConfig.forEach(col => {
            if (visibleCols.some(c => c.props === col.props)) {
              newColumnConfig.push(visibleCols[visibleIndex++]);
            } else {
              newColumnConfig.push(col);
            }
          });
          // 4. 更新数据
          this.form.columnConfig = newColumnConfig;
        }
      });
    },
    handleCheckedColsChange (values) {
      for (let index = 0; index < this.form.columnConfig.length; index++) {
        const item = this.form.columnConfig[index];
        item.visible = values.includes(item.props);
      }
      this.updateCheck();
    },
    handleCheckAllChange () {
      this.checkedCols = [];
      for (let index = 0; index < this.form.columnConfig.length; index++) {
        const item = this.form.columnConfig[index];
        item.visible = true;
        this.checkedCols.push(item.props);
      }
      this.updateCheck();
    },
    handleNotCheckAllChange () {
      this.checkedCols = [];
      for (let index = 0; index < this.form.columnConfig.length; index++) {
        const item = this.form.columnConfig[index];
        if (item.disabled) {
          item.visible = true;
          this.checkedCols.push(item.props);
        } else {
          item.visible = false;
        }
      }
      this.updateCheck();
    },
    updateCheck () {
      this.$nextTick(() => {
        const checkAll = this.form.columnConfig.every(item => item.disabled || item.visible);
        const notCheckAll = this.form.columnConfig.every(item => item.disabled || !item.visible);
        this.checkAll = checkAll;
        this.notCheckAll = notCheckAll;
        this.isCheckIndeterminate = !checkAll && !notCheckAll;
        this.isNoCheckIndeterminate = !checkAll && !notCheckAll;
      });
    },
    /**
     * 对外暴露当前表格配置(列显隐 + 顺序 + 基础设置)。
     */
    getTableConfig () {
      return {
        autoWrap: this.form.autoWrap,
        layout: this.form.layout,
        isOperateFixed: this.form.isOperateFixed,
        columnConfig: this.form.columnConfig.map(item => ({ ...item }))
      };
    }
  },
  beforeDestroy () {
    if (this.sortable) this.sortable.destroy();
  }
};
</script>

<style lang="scss">
/* 样式沿用 design 包 optionModal 的 .option-modal-wrapper 命名,保持视觉一致 */
.c-ts {
  .el-form-item {
    margin-bottom: 0;
  }
  .el-form-item__label {
    text-align: left;
  }

  .c-ts__header {
    font-weight: 600;
    margin-top: 12px;
    &:first-child {
      margin-top: 0;
    }
    em {
      font-size: 14px;
      color: #9d9f9d;
      font-weight: 400;
      margin-left: 5px;
      font-style: normal;
    }
  }
  .c-ts__search {
    margin: 12px 0;
    width: 320px;
  }
  .c-ts__grid {
    display: grid;
    grid-template-columns: repeat(5, 18%);
    gap: 12px;
  }

  .c-ts__grid-item {
    .el-checkbox {
      width: calc(100% - 20px);
    }

    .el-checkbox__label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 93%;
      display: inline-block;
      vertical-align: middle;
    }
  }

  .sortable-ghost {
    opacity: 0.5;
    background: #c8ebfb;
  }

  .c-ts__cols {
    margin-top: 8px;
    padding: 12px;
    background: #fcfbfb;
    border-radius: 4px;
  }

  .c-ts__multi-cols {
    line-height: 28px;
    &>span {
      margin-right: 20px;
    }
  }

  .c-ts__move-icon {
    width: 16px;
    height: 22px;
    display: inline-block;
    vertical-align: top;
    margin-right: 4px;
    cursor: move;
  }
}
</style>
