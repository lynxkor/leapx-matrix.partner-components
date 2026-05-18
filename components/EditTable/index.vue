<script>
/**
 * 可编辑表格组件
 * @author wangtao
 * @description 基于vxe-table和element-ui的可编辑表格组件，支持行内编辑、数据验证、动态列配置等功能
 *
 * @param {Object} editConfig -
 * @param {Object} auth - 操作权限配置
 * @param {Boolean} auth.add - 是否显示新增按钮
 * @param {Boolean} auth.edit - 是否显示编辑按钮
 * @param {Boolean} auth.delete - 是否显示删除按钮
 * @param {Array} columns - 表格列配置数组
 * @param {String} columns[].field - 列字段名
 * @param {String} columns[].title - 列标题
 * @param {Number} columns[].width - 列宽度
 * @param {Number} columns[].minWidth - 列最小宽度
 * @param {Boolean} columns[].editable - 是否可编辑
 * @param {Object} columns[].editRender - 编辑渲染器配置
 * @param {String} columns[].editRender.name - 编辑组件名称
 * @param {Boolean} columns[].editRender.multiRow - 编辑组件 选择下拉组件 是否显示两行
 * @param {Object} columns[].editRender.props - 编辑组件属性
 * @param {Object} columns[].editRender.$listeners - 编辑组件事件
 * @param {Function} columns[].formatter - 列数据格式化函数
 * @param {Function} columns[].drag - 开启拖拽排序
 * @param {Array} columns[].rules - 列验证规则
 * @param {any} columns[].defaultValue - 列默认值
 * @param {Array} data - 表格数据
 * @param {Boolean} showPagination - 是否显示分页组件
 * @param {Number} total - 数据总数
 * @param {Number} currentPage - 当前页码
 * @param {Number} pageSize - 每页显示数量
 * @param {Boolean} loading - 加载状态
 * @param {Object} defaultNewRow - 新增行默认数据
 * @param {Boolean} showToolbar - 是否显示工具栏
 * @param {Object} options - 下拉选项数据集合，key为字段名，value为选项数组
 * @param {String} delTitle - 删除确认标题
 * @param {Boolean} checkbox - 增加勾选配置
 *
 * @event add-row - 新增行时触发，参数为新行数据
 * @event edit-row - 编辑行时触发，参数为{row, rowIndex}
 * @event remove-row - 删除行时触发，参数为被删除的行数据和索引
 * @event save-all - 保存全部数据时触发，参数为所有表格数据
 * @event reset - 重置表格时触发
 * @event cell-change - 单元格值变化时触发，参数为{row, column, value}
 * @event cell-edit - 单元格进入编辑状态时触发，参数为{row, column}
 * @event value-change - 编辑组件值变化时触发，参数为{row, column, value}
 * @event value-select - 编辑组件选择选项时触发，参数为{row, column, data}
 * @event page-size-change - 分页大小改变时触发，参数为新的大小
 * @event current-page-change - 当前页码改变时触发，参数为新的页码
 * @event checkbox-change - 增加勾选事件{selection}
 *
 * @method getData - 获取当前表格数据
 * @method setData - 设置表格数据
 * @method clearValidate - 清除验证状态
 * @method validate - 验证表格数据
 */
</script>
<template>
  <div class="edit-table-container">
    <vxe-toolbar v-if="showToolbar">
      <template #buttons>
        <el-button v-if="auth.add" size="small" type="primary" icon="el-icon-plus" @click="addRow">新增行</el-button>
        <el-button size="small" type="success" icon="el-icon-circle-check" @click="saveAll">保存全部</el-button>
        <el-button size="small" type="warning" icon="el-icon-refresh" @click="resetTable">重置</el-button>
      </template>
    </vxe-toolbar>

    <vxe-table
      ref="editTable"
      :data="tableData"
      :edit-config="editConfig"
      :loading="loading"
      border="inner"
      stripe
      resizable
      :row-config="{isHover: true,  drag: true}"
      size="medium"
      show-overflow
      keep-source
      :edit-rules="editRules"
      :cell-config="{height: 40}"
      :header-cell-config="{height: 40}"
      min-height="0"
      max-height="500px"
      @edit-closed="handleEditClosed"
      @edit-actived="handleEditActived"
      @checkbox-change="checkboxChange"
      @checkbox-all="selectAllCheckboxChange"
    >
      <vxe-column v-if="checkbox" type="checkbox" width="54" fixed="left" />
      <vxe-column v-if="seq" type="seq" width="70"></vxe-column>
      <vxe-column
        v-for="col in columns"
        :key="col.field"
        :field="col.field"
        :title="col.title"
        :width="col.width"
        :min-width="col.minWidth"
        :drag-sort="col.drag"
        :edit-render="col.editable ? (col.editRender || {}) : null"
        :formatter="col.formatter"
        :tableField="col.tableField"
      >
        <template #edit="{ row, column }">
          <component
            :is="getEditorComponent(column.editRender.name)"
            popper-class="vxe-table--ignore-clear"
            v-bind="column.editRender.props"
            v-on="listeners(row, column)"
            v-model="row[column.field]"
            :options="getFetchSelectOptions(row, column)"
            @change="(...args) => onValueChange(row, column, ...args)"
            @select="d => onValueSelect(row, column, d)"
          >
            <template v-if="column.editRender.name === 'ElSelect'">
              <!-- 多行展示 -->
              <template v-if="column.editRender.multiRow">
                <el-option
                  class="multi-row"
                  v-for="option in getOptions(row, column)"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                >
                  <div class="label">{{ option.label }}</div>
                  <div class="label-desc">{{ option.labelDesc }}</div>
                </el-option>
              </template>
              <!-- 单行展示 -->
              <template v-else>
                <el-option
                  v-for="option in getOptions(row, column)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </template>
            </template>
          </component>
        </template>

        <template #default="{ row, column }">
          <slot v-if="$scopedSlots.default" :row="row" :column="column" :col="col"></slot>
          <template v-else>
            <span v-if="column.formatter">{{ column.formatter(row[column.field], row, column) }}</span>
            <span v-else>{{ row[column.field] }}</span>
            <template v-if="col.mask">
              <span v-if="!row[column.field + 'Mask']" @click="$emit('mask', row, column)" class="eye-icon iconfont icon-lxppc-eye"></span>
              <span v-else @click="$emit('mask', row, column)" class="eye-icon iconfont icon-lxppc-eye-off"></span>
            </template>
          </template>
        </template>
      </vxe-column>

      <!-- 行插槽 -->
      <template v-if="$scopedSlots.row" #default="{ row, rowIndex }">
        <slot name="row" :row="row" :rowIndex="rowIndex"></slot>
      </template>

      <vxe-column v-if="defaultNewRow" title="操作" :width="actionWidth" align="center" fixed="right" :resizable="false">
        <template #default="{ row, rowIndex }">
          <template v-if="enableSingleRowSave && (isEditByRow(row, rowIndex) || isNeedSave(row, rowIndex))">
            <span
              class="action-button btn-edit"
              :class="{'disabled': disabled}"
              @click="saveRowEdit(row, rowIndex)"
              v-if="auth.edit"
            >
              保存
            </span>
            <span
              class="action-button btn-edit"
              @click="cancelEdit(row, rowIndex)"
              v-if="auth.edit"
            >
              取消
            </span>
          </template>
          <template v-else>
            <slot name="btn-before" :row="row" :rowIndex="rowIndex"></slot>
            <span
              class="action-button btn-edit"
              @click="editRow(row, rowIndex)"
              :class="{'disabled': disabled}"
              v-if="auth.edit"
            >
              编辑
            </span>
            <slot name="btn-middle" :row="row" :rowIndex="rowIndex"></slot>
            <el-popconfirm
              :title="delTitle"
              @confirm="removeRow(rowIndex)"
              v-if="auth.delete"
            >
              <el-button
                class="action-button btn-delete"
                :class="{'disabled': disabled}"
                :disabled="disabled"
                slot="reference"
                type="text">
                删除
              </el-button>
            </el-popconfirm>
            <slot name="btn-after" :row="row" :rowIndex="rowIndex"></slot>
          </template>
        </template>
      </vxe-column>
      <template #empty>
        <div class="m-vxe-table-empty-text" v-if="emptyText">
          {{ emptyText }}
        </div>
      </template>
    </vxe-table>

    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
import { createDefer } from '../../utils/defer';
import { debounce } from '../../utils/index';

export default {
  name: 'EditTable',
  components: {
    // 简单异步加载
    FetchSelect: () => import('../FetchSelect'),
    BaseInput: () => import('../BaseInput'),
  },
  props: {
    editConfig: {
      type: [Object, Boolean],
      default: () => ({ trigger: 'click', mode: 'row', showStatus: true }),
    },
    // 表格列配置
    auth: {
      type: Object,
      default: () => ({
        edit: true,
        delete: true,
        add: true
      })
    },
    // 表格列配置
    columns: {
      type: Array,
      default: () => []
    },
    // 表格数据
    data: {
      type: Array,
      default: () => []
    },
    // 是否显示分页
    showPagination: {
      type: Boolean,
      default: false
    },
    // 总数据量
    total: {
      type: Number,
      default: 0
    },
    // 当前页码
    currentPage: {
      type: Number,
      default: 1
    },
    // 每页数量
    pageSize: {
      type: Number,
      default: 20
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 删除确认标题
    delTitle: {
      type: String,
      default: '确定要删除这条记录吗？'
    },
    // 新增行默认值
    defaultNewRow: {
      type: Object,
      default: () => (null)
    },
    // 是否显示顶部工具栏
    showToolbar: {
      type: Boolean,
      default: false
    },
    // 编辑项的下拉框内容集合
    options: {
      type: Object,
      default: () => ({})
    },
    // 是否默认勾选
    checkbox: {
      type: Boolean,
      default: false
    },
    // 序号
    seq: {
      type: Boolean,
      default: false
    },
    // 新增行时，是否需要聚焦，由于旧版是开启的所以默认true
    isFocusNewRow: {
      type: Boolean,
      default: true,
    },
    // 是否开启单行保存功能
    enableSingleRowSave: {
      type: Boolean,
      default: false,
    },
    // 操作栏的宽度
    actionWidth: {
      type: Number,
      default: 150,
    },
    // 空提示信息
    emptyText: {
      type: String,
      default: '暂无数据'
    },
    // 禁用模式
    disabled: {
      type: Boolean,
      default: false,
    }
  },
  data () {
    return {
      tableData: [],
      editRules: {},
      // 保存编辑前的数据
      originalData: [],
    };
  },
  watch: {
    data: {
      handler (newVal, oldVal) {
        this.tableData = [...(newVal || [])].map((item) => this.setKey(item));
        try {
          // 深拷贝当前行数据
          this.originalData = this.copy(this.tableData);
        } catch(e) {
          this.originalData = [];
        }
      },
      deep: false,
      immediate: true,
    },
  },
  computed: {
  },
  mounted () {
    // 初始化验证规则
    this.initEditRules();
  },
  methods: {
    /**
     * 设置唯一标识 __key__
     */
    setKey(item) {
      item.__key__ = 'row_' + Math.random();
      if (!item.__options__) {
        item.__options__ = {}
      }
      return item;
    },
    /**
     * FetchSelect的下拉选项
     */
    getFetchSelectOptions(row, column) {
      if (row.__options__[column.field]) {
        return row.__options__[column.field];
      }
      if (column?.editRender?.props?.options) {
        return column.editRender.props.options;
      }
      return null;
    },
    /**
     * 获取下拉数据
     */
    getOptions (row, column) {
      const options = this.getFetchSelectOptions(row, column);
      if (options) {
        return options;
      }
      return this.options[column.field];
    },
    /**
     * 增加勾选
     */
    checkboxChange (selection) {
      let checkedRows = this.$refs.editTable.getCheckboxRecords();
      this.$emit('checkboxChange', checkedRows);
    },
    /**
     * 全选
     */
    selectAllCheckboxChange (selection) {
      this.$emit('checkboxChange', selection.records);
    },
    /**
     * 获取编辑器组件
     */
    getEditorComponent (name) {
      // 根据编辑渲染器名称返回对应的组件
      const componentMap = {
        input: 'input',
        ElInput: 'el-input',
        ElInputNumber: 'el-input-number',
        ElSelect: 'el-select',
        ElDatePicker: 'el-date-picker',
        ElSwitch: 'el-switch',
        ElRate: 'el-rate',
        ElAutocomplete: 'el-autocomplete',
        FetchSelect: 'fetch-select',
        BaseInput: 'base-input',
      };
      return componentMap[name] || 'input';
    },

    /**
     * 初始化编辑验证规则
     */
    initEditRules () {
      const rules = {};
      this.columns.forEach(column => {
        if (column.rules) {
          rules[column.field] = column.rules;
        }
      });
      this.editRules = rules;
    },

    /**
     * 检查行是否可编辑
     */
    isRowEditable (row) {
      // 检查是否有至少一个字段是可编辑的
      return this.columns.some(column => column.editable);
    },

    // 判断行是否为激活编辑状态
    isEditByRow (row, rowIndex) {
      return this.$refs.editTable.isEditByRow(row);
    },
    /**
     * 当前行是否需要保存（未保存）
     */
    isNeedSave (row, rowIndex) {
      const datum = this.originalData.find(item => item.__key__ === row.__key__);
      // 新增的数据直接返回true
      if (!datum) {
        return true;
      }

      // 对defaultNewRow上的key对应的值进行一一比较，存在不相等返回true
      let keys = this.defaultNewRow ? Object.keys(this.defaultNewRow || {}) : Object.keys(datum);

      for (let key of keys) {
        // 这里使用宽松不相等，兼容switch组件('1' == true)
        if (datum[key] !== row[key]) {
          return true;
        }
      }

      return false;
    },

    /**
     * 添加新行
     */
    addRow (datum) {
      let newRow;
      if (datum) {
        newRow = datum;
      } else {
        newRow = { ...this.defaultNewRow };
        // 如果没有提供默认值，则初始化为空对象
        if (Object.keys(newRow).length === 0) {
          this.columns.forEach(col => {
            newRow[col.field] = col.defaultValue !== undefined ? col.defaultValue : '';
          });
        }
      }

      const _newRow = this.setKey(newRow);
      this.tableData.unshift(_newRow);
      this.$refs.editTable.setEditRow(_newRow);
      // 聚焦到第一个input
      if (this.isFocusNewRow) {
        setTimeout(() => {
          const firstInput = this.$refs.editTable.$el.querySelector('input');
          if (firstInput) {
              firstInput.focus();
          }
        }, 300);
      }
      // 触发事件通知父组件
      this.$emit('add-row', _newRow);
    },

    /**
     * 编辑行
     */
    editRow (row, rowIndex) {
      if (this.disabled) {
        return;
      }
      // 只有当行中有可编辑字段时才激活编辑
      if (this.isRowEditable(row)) {
        // 激活行编辑
        this.$refs.editTable.setEditRow(row);
        this.$emit('edit-row', { row, rowIndex });
      }
    },

    /**
     * 删除行
     */
    removeRow (index) {
      if (this.disabled) {
        return;
      }
      const removedRow = this.tableData.splice(index, 1)[0];
      const defer = createDefer();
      this.$emit('remove-row', removedRow, index, defer);
      defer.promise.then(() => {
        //
      }).catch(() => {
        // 删除失败，数据回退
        this.tableData.splice(index, 0, removedRow);
      })
    },

    /**
     * 保存所有数据
     */
    saveAll () {
      // 验证所有编辑过的单元格
      return this.$refs.editTable.validate(true).then((errMap) => {
        if (errMap) {
          this.$message.warning('请检查输入项是否正确');
          return Promise.reject(new Error('验证失败'));
        }

        // 发送保存事件
        this.$emit('save-all', this.tableData);
        return Promise.resolve(this.tableData);
      }).catch(e => {
        console.error('保存失败:', e);
        return Promise.reject(e);
      });
    },

    /**
     * 重置表格数据
     */
    resetTable () {
      if (!this.showToolbar) {
        // 如果不显示工具栏，直接执行重置操作
        this.tableData = [...this.data];
        this.$emit('reset');
        this.$message.info('已重置表格数据');
        return;
      }

      this.$confirm('确定要重置表格数据吗？未保存的数据将会丢失', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.tableData = [...this.data];
        this.$emit('reset');
        this.$message.info('已重置表格数据');
      }).catch(() => {
        // 用户取消重置
      });
    },

    /**
     * 编辑完成事件
     */
    handleEditClosed ({ row, column }) {
      const $table = this.$refs.editTable;
      const cellValue = row[column.property];

      // 判断单元格值是否发生变化
      if ($table.isUpdateByRow(row, column.property)) {
        this.$emit('cell-change', { row, column, value: cellValue });
      }
    },

    /**
     * 编辑激活事件
     */
    handleEditActived ({ row, column }) {
      this.$emit('cell-edit', { row, column });
    },

    /**
     * 值变更事件
     */
    onValueChange (row, column, value, ...args) {
      const option = this.options[column.property]?.find(option => option.value === value);
      if (option) {
        for (const key in option) {
          row[key] = option[key];
        }
      }
      if (!row[column.property]) {
        row[column.property] = value;
      }
      this.$emit('value-change', { row, column, value: row[column.property] }, ...args);
    },

    /**
     * 值选择事件（专门处理autocomplete的选中事件）
     */
    onValueSelect (row, column, data) {
      // 更新行数据
      for (const key in row) {
        const keyLowercase = key.toLowerCase();
        row[key] = data[key] || data[keyLowercase];
      }
      this.$emit('value-select', { row, column, data });
    },
    /**
     * 分页大小改变
     */
    handleSizeChange (val) {
      this.$emit('page-size-change', val);
    },

    /**
     * 当前页改变
     */
    handleCurrentChange (val) {
      this.$emit('current-page-change', val);
    },

    /**
     * 获取表格数据
     */
    getData () {
      return this.tableData;
    },

    /**
     * 设置表格数据
     */
    setData (data) {
      this.tableData = [...data];
    },

    /**
     * 清空验证
     */
    clearValidate () {
      this.$refs.editTable.clearValidate();
    },

    /**
     * 验证表格
     */
    validate () {
      return this.$refs.editTable.validate();
    },
    /**
     * 取消编辑，恢复数据
     */
    cancelEdit(row, rowIndex) {
      this.clearEdit();
      const datum = this.originalData.find(item => item.__key__ === row.__key__);
      if (datum) {
        this.tableData.splice(rowIndex, 1, this.copy(datum));
      } else {
        // 对于新增的行取消操作，直接删除该行
        this.tableData.splice(rowIndex, 1);
      }
    },
    copy (data) {
      try {
        return JSON.parse(JSON.stringify(data));
      } catch(e) {
        //
      }
    },
    /**
     * 关闭编辑状态
     */
    clearEdit() {
      this.$refs.editTable.clearEdit();
    },
     /**
     * 单行保存
     */
    saveRowEdit: debounce(function (row, rowIndex) {
      if (this.disabled) {
        return;
      }
      this.$refs.editTable.validate(row).then((errMap) => {
        if (errMap) {
          this.$message.warning('请检查输入项是否正确');
          return Promise.reject(new Error('验证失败'));
        }

        const defer = createDefer();
        this.$emit('save-row-edit', row, defer);

        defer.promise.then(id => {
          if (id && typeof id === 'string') {
            row.id = id;
          }
          const newRow = this.copy(row);
          const datum = this.originalData.find(item => item.__key__ === row.__key__);
          if (!datum) {// 新增
            this.originalData.splice(rowIndex, 0, newRow);
          } else { // 更新
            this.originalData.splice(rowIndex, 1, newRow);
          }
          //
          this.clearEdit();
        }).catch((e) => {
          //
        });

      });
    }, 300),
    // 编辑组件事件监听
    listeners (row, column) {
      const listeners = column.editRender.$listeners || {};
      const keys = Object.keys(listeners);
      const events = keys.reduce((ans, key) => {
        ans[key] = (val) => {
          if (typeof listeners[key] === 'function') {
            listeners[key](val, row, column);
          }
        }
        return ans;
      }, {});
      return events;
    },
    // 用于组件联动时快速更新下拉数据
    updateRow (row) {
      this.$refs.editTable.updateData(row, row);
    }
  }
};
</script>

<style lang="scss" scoped>
.edit-table-container {
  ::v-deep .vxe-table--render-default.size--medium .vxe-header--column.is--padding .vxe-cell,
  ::v-deep .vxe-table--render-default .vxe-body--column:not(.col--active).col--ellipsis > .vxe-cell,
  ::v-deep .vxe-table--render-default.size--medium .vxe-body--column.is--padding .vxe-cell {
    padding: 8px 16px!important;
  }
  .vxe-toolbar {
    margin-bottom: 10px;
  }
  .m-vxe-table-empty {
    height: 300px;
  }
  .m-vxe-table-empty-text {
    text-align: left;
  }
  ::v-deep .vxe-table--empty-content {
    color: #9D9F9D;
    width: 100%;
    padding: 0 16px;
  }
  .vxe-default-input {
    width: 100%;
    height: 32px;
    line-height: 32px;
    padding: 0 5px;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #409EFF;
    }
  }

  .table-pagination {
    margin-top: 15px;
    display: flex;
    justify-content: flex-end;
  }

  .action-button{
    margin: 0 5px;
    cursor: pointer;
    &.btn-edit{
      color:#4C4CD6;
    }
    &.btn-delete{
      color: #b91919 !important;;
    }
    &.disabled{
      cursor: not-allowed;
      color: var(--disabled-color);
    }
  }
}
.el-select-dropdown__item.multi-row{
  height: 54px;
  .label{
    line-height: 25px;
    height: 25px;
  }
  .label-desc{
    line-height: 25px;
    height: 25px;
    color: #999999;
    font-size: 12px;
  }
}
.eye-icon{
  vertical-align: text-top;
  font-size: 20px;
  margin-left: 10px;
  cursor: pointer;
  color: #009100;
}
</style>
