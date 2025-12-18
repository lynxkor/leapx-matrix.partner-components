<script>
/**
 * 可编辑表格组件
 * @author wangtao
 * @description 基于vxe-table和element-ui的可编辑表格组件，支持行内编辑、数据验证、动态列配置等功能
 *
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
 * @param {Boolean} columns[].editRender.multiRow - 编辑 选择下拉组件 是否显示两行
 * @param {Object} columns[].editRender.props - 编辑组件属性
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
      :edit-config="{trigger: 'click', mode: 'row', showStatus: true}"
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
      height="100%"
      min-height="360px"
      max-height="500px"
      @edit-closed="handleEditClosed"
      @edit-actived="handleEditActived"
      @checkbox-change="checkboxChange"
      @checkbox-all="selectAllCheckboxChange"
    >
      <vxe-column v-if="checkbox" type="checkbox" width="80" fixed="left" />
      <vxe-column
        v-for="column in columns"
        :key="column.field"
        :field="column.field"
        :title="column.title"
        :width="column.width"
        :min-width="column.minWidth"
        :drag-sort="column.drag"
        :edit-render="column.editable ? (column.editRender || {}) : null"
      >
        <template #edit="{ row, column }">
          <component
            :is="getEditorComponent(column.editRender.name)"
            popper-class="vxe-table--ignore-clear"
            v-bind="column.editRender.props"
            v-model="row[column.field]"
            @change="d => onValueChange(row, column, d)"
            @select="d => onValueSelect(row, column, d)"
          >
            <template v-if="column.editRender.name === 'ElSelect'">
              <!-- 多行展示 -->
              <template v-if="column.editRender.multiRow">
                <el-option
                  class="multi-row"
                  v-for="option in options[column.field]"
                  :key="option.value"
                  :value="option.value"
                  :label="option.label"
                >
                  <div class="label">{{ option.label }}</div>
                  <div class="label-desc">{{ option.labelDesc }}</div>
                </el-option>
              </template>
              <template v-else>
                <el-option
                  v-for="option in options[column.field]"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </template>
            </template>
          </component>
        </template>

        <template #default="{ row, column }">
          <span v-if="column.formatter">{{ column.formatter(row[column.field], row, column) }}</span>
          <span v-else>{{ row[column.field] }}</span>
        </template>
      </vxe-column>

      <vxe-column v-if="defaultNewRow" title="操作" width="150" align="center" fixed="right" :resizable="false">
        <template #default="{ row, rowIndex }">
          <span
            class="action-button btn-edit"
            @click="editRow(row, rowIndex)"
            :disabled="!isRowEditable(row)"
            v-if="auth.edit"
          >
            编辑
          </span>

          <el-popconfirm
            :title="delTitle"
            @confirm="removeRow(rowIndex)"
            v-if="auth.delete"
          >
            <span
              slot="reference"
              class="action-button btn-delete"
            >
              删除
            </span>
          </el-popconfirm>
        </template>
      </vxe-column>
      <template #empty>
        <div class="m-vxe-table-empty">
          <img :src="require('../../assets/images/empty.png')" />
          <p>暂无数据</p>
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
export default {
  name: 'EditTable',
  components: {
    // 简单异步加载
    FetchSelect: () => import('../FetchSelect'),
  },
  props: {
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
    isFocusNewRow: { // 新增行时，是否需要聚焦
      type: Boolean,
      default: true,
    }
  },
  data () {
    return {
      tableData: [],
      editRules: {}
    };
  },
  watch: {
    data: {
      handler (newVal) {
        this.tableData = [...(newVal || [])];
      },
      immediate: true
    }
  },
  mounted () {
    // 初始化验证规则
    this.initEditRules();
  },
  methods: {
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
        ElSelect: 'el-select',
        ElDatePicker: 'el-date-picker',
        ElSwitch: 'el-switch',
        ElRate: 'el-rate',
        ElAutocomplete: 'el-autocomplete',
        FetchSelect: 'fetch-select',
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
      console.log('校验规则初始化:', rules);
    },

    /**
     * 检查行是否可编辑
     */
    isRowEditable (row) {
      // 检查是否有至少一个字段是可编辑的
      return this.columns.some(column => column.editable);
    },

    /**
     * 添加新行
     */
    addRow () {
      const newRow = { ...this.defaultNewRow };
      // 如果没有提供默认值，则初始化为空对象
      if (Object.keys(newRow).length === 0) {
        this.columns.forEach(col => {
          newRow[col.field] = col.defaultValue !== undefined ? col.defaultValue : '';
        });
      }

      this.tableData.unshift(newRow);
      this.$refs.editTable.setEditRow(newRow);
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
      this.$emit('add-row', newRow);
    },

    /**
     * 编辑行
     */
    editRow (row, rowIndex) {
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
      const removedRow = this.tableData.splice(index, 1)[0];
      this.$emit('remove-row', removedRow, index);
      // this.$message.success('删除成功');
    },

    /**
     * 保存所有数据
     */
    saveAll () {
      // 验证所有编辑过的单元格
      return this.$refs.editTable.validate(true).then((errMap) => {
        if (errMap) {
          // this.$message.error('请检查输入项是否正确');
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
    onValueChange (row, column, d) {
      const option = this.options[column.property]?.find(option => option.value === d);
      if (option) {
        for (const key in option) {
          row[key] = option[key];
        }
      }
      if (!row[column.property]) {
        row[column.property] = d;
      }
      this.$emit('value-change', { row, column, value: row[column.property] });
    },

    /**
     * 值选择事件（专门处理autocomplete的选中事件）
     */
    onValueSelect (row, column, data) {
      // 更新行数据
      // const editableCols = this.columns.filter(col => col.editable).map(col => { return col.field; });
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
    }
  }
};
</script>

<style lang="scss" scoped>
.edit-table-container {
  .vxe-toolbar {
    margin-bottom: 10px;
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
      color:#B91919;
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
</style>
