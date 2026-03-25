<script>
/**
 * 增强型标签页组件
 *
 * @module EnhancedTabs
 * @description 支持远程加载、动态添加、搜索过滤等高级功能的标签页组件
 *
 * @example
 * // 基本用法
 * <enhanced-tabs v-model="activeTab" :items="tabItems" @change="onTabChange" />
 *
 * @example
 * // 远程数据加载
 * <enhanced-tabs
 *   :load-data="fetchTabsData"
 *   :load-params="queryParams"
 *   :item-config="{
 *     valueKey: 'id',
 *     labelKey: 'name'
 *   }"
 * />
 *
 * @example
 * // 支持搜索添加
 * <enhanced-tabs
 *   :remote-method="searchItems"
 *   :select-config="{
 *     placeholder: '搜索并添加标签页'
 *   }"
 *   @add="onTabAdd"
 * />
 *
 * @example
 * 复杂案例
 * <enhanced-tabs
 *   ref="tabs"
 *   type="rect"
 *   v-model="partId"
 *   :load-params="loadParams"
 *   :load-data="loadData"
 *   :autoSelectFirst="true"
 *   :item-config="{
 *     valueKey: 'id',
 *     labelKey: 'repairItemName',
 *     disableCloseKey: 'disableClose',
 *     disableFirst: false,
 *     labelFormat: '${repairItemName}(${repairItemCode})',
 *   }"
 *   :remote-method="repairRemote"
 *   :select-config="{
 *     valueKey: 'id',
 *     labelKey: 'name',
 *     labelFormat: '${name}(${code})',
 *     placeholder: '输入项目零件代码、名称',
 *   }"
 *   close-tip="确定删除该项目零件吗？"
 *   :disabled="!isEditing"
 *   @remove="onRemove"
 *   @add="onTabAdd"
 *   :menus="menus"
 *   />
 */
/**
 * 组件属性定义
 * @typedef {Object} EnhancedTabsProps
 * @property {'normal'|'menu'|'rect'} type - 标签页展示类型
 * @property {String|Number} value - 当前激活的标签页值，支持 v-model 双向绑定
 * @property {Array} items - 标签页数据项数组
 * @property {Boolean} disabled - 是否禁用标签页操作（添加、关闭等）
 * @property {Object} loadParams - 远程数据加载参数，作为loadData的请求参数
 * @property {Function} loadData - 远程数据加载方法，用于初始化标签页数据
 * @property {Object} itemConfig - 数据映射配置，用于格式化 loadData 返回的数据
 * @property {Function} remoteMethod - 远程搜索方法，用于搜索并添加标签页
 * @property {Object} selectConfig - 下拉搜索配置，用于映射 remoteMethod 返回的数据
 * @property {String} closeTip - 关闭标签页时的确认提示信息
 * @property {Boolean} autoSelectFirst - 是否自动选中第一项标签页
 */
</script>

<template>
  <base-tabs
    ref="baseTabs"
    :type="type"
    :items="$data._items"
    :value="internalValue"
    :closeTip="closeTip"
    :disabled="disabled"
    @change="onTabChange"
    @close="onTabClose"
    v-bind="$attrs"
    v-on="$listeners"
    >
    <template v-if="!disabled" slot="add-popover">
      <fetch-select
        v-if="remoteMethod"
        filterable
        clearable
        remote
        reserve-keyword
        v-model="selectValue"
        :remote-method="onRemote"
        @change="onAdd"
        :value-key="selectConfig.valueKey"
        :label-key="selectConfig.labelKey"
        :placeholder="selectConfig.placeholder"
      />
      <base-input
        v-else
        v-model="inputValue"
        placeholder="请输入内容"
        @keyup.enter.native="onInputEnter"
      />
    </template>
  </base-tabs>
</template>
<script>

import BaseTabs from '../BaseTabs';
import FetchSelect from '../FetchSelect';
import { createDefer } from '../../utils/defer';
import BaseInput from '../BaseInput';
import { renderTemplate } from './format';

export default {
  name: 'EnhancedTabs',
  inheritAttrs: false,
  components: {
    BaseTabs,
    FetchSelect,
    BaseInput,
  },
  props: {
    // 展示类型
    type: {
      type: String,
      default: 'normal',
      validator: (value) => {
        return ['normal', 'menu', 'rect'].includes(value);
      }
    },
    // 添加 value 支持 v-model
    value: {
      type: [String, Number],
      default: ''
    },
    // 初始数据
    items: {
      type: Array,
      default: () => [],
    },
    // 禁用模式
    disabled: {
      type: Boolean,
      default: false,
    },
    // 加载参数
    loadParams: {
      type: Object,
      default: () => ({})
    },
    // 远程数据加载方法（用于初始化）
    loadData: {
      type: Function,
      default: null
    },
    // 数据映射配置, (loadData数据进行映射)
    itemConfig: {
      type: Object,
      default: () => ({
        valueKey: 'id',
        labelKey: 'name',
        disableCloseKey: 'disableClose',
        disableFirst: true,
        labelFormat: '', // 是否需要对tab的展示内容进行格式化，例如 '${name}($code)' = '名称(编码)'
      })
    },
    // 搜索获取下拉数据
    remoteMethod: {
      type: Function,
      default: null
    },
    // 下拉搜索配置，remoteMethod数据进行映射
    selectConfig: {
      type: Object,
      default: () => ({
        valueKey: 'id',
        labelKey: 'name',
        placeholder: '请选择',
        labelFormat: '', // 是否需要对tab的展示内容进行格式化，例如 '${name}($code)' = '名称(编码)'
      })
    },
    // 关闭确认提示
    closeTip: {
      type: String,
      default: '确定删除该项吗？'
    },
    // 是否自动选中第一项
    autoSelectFirst: {
      type: Boolean,
      default: true
    },
  },
  data () {
    return {
      _items: [],
      _value: '',
      selectValue: '',
      loading: false,
      inputValue: '',
    };
  },
  computed: {
    internalValue: {
      get () {
        return this.value || this.$data._value;
      },
      set (val) {
        this.$data._value = val; // 没有v-model情况生效
        this.$emit('input', val); // 使v-model生效
      }
    },
  },
  watch: {
    /**
     * 监听初始数据变化
     * @param {Array} newItems - 新的标签页数据
     */
    items: {
      immediate: true,
      handler (newItems) {
        this.initializeItems(newItems);
      }
    },
    /**
     * 监听加载参数变化
     */
    loadParams: {
      handler () {
        this.internalValue = '';
        this.loadRemoteData();
      },
      immediate: true,
      deep: true,
    },
  },
  mounted () {
  },
  methods: {
    emitChange (item, index) {
      this.$emit('change', item, index);
    },
    onTabChange (item, i) {
      this.internalValue = item.value;
      this.emitChange(item, i);
    },
    onTabClose (item, index) {
      // 1. 安全检查
      if (item.disableClose) {
        this.$message.warning('此标签页不可关闭');
        return;
      }
      // 2. 记录删除前状态
      const wasActive = item.value === this.internalValue;

      // 3. 执行删除
      this.$data._items.splice(index, 1);
      const defer = createDefer();
      this.$emit('remove', item, index, defer);
      defer.promise.then(() => {
        //
      }).catch((e) => {
        // 删除失败回退
        this.$data._items.splice(index, 0, item);
      });

      // 4. 处理删除后的选中状态
      if (wasActive) {
        if (this.$data._items.length > 0) {
          const firstItem = this.$data._items[0];
          this.internalValue = firstItem.value;
          this.emitChange(firstItem, 0);
        } else {
          this.internalValue = '';
          this.emitChange(null, -1);
        }
      }
    },
    onRemote (query) {
      if (typeof this.remoteMethod === 'function') {
        return this.remoteMethod(query);
      }
    },
    onAdd (val, record) {
      if (val) {
        const fItem = this.$data._items.find(item => item.value === val);
        if (fItem) {
          this.selectValue = '';
          this.$message.error('数据重复添加');
          return;
        }

        const label = this.selectConfig.labelFormat
        ? renderTemplate(record, this.selectConfig.labelFormat) : record[this.selectConfig.labelKey];
        const newItem = {
          ...record,
          label,
          value: record[this.selectConfig.valueKey],
        };

        if (this.$listeners.add) {
          const defer = createDefer();
          this.$emit('add', newItem, defer);
          defer.promise.then(v => {
            newItem.value = v;
            this.$data._items.push(newItem);
            this.$message.success('添加成功');
          }).catch((e) => {
            console.log(e);
          })
        } else {
          this.$data._items.push(newItem);
        }
      }
      this.selectValue = '';
    },
    /**
     * 初始化 items
     */
    initializeItems (data = []) {
      if (!Array.isArray(data) || data.length === 0) {
        this.$data._items = [];
        return;
      }
      const processedItems = data.map((item, index) => {

        const value = item[this.itemConfig.valueKey];
        let label;
        if (item.noFormat) {
          label = item[this.itemConfig.labelKey];
        } else if (this.itemConfig.labelFormat) {
          label = renderTemplate(item, this.itemConfig.labelFormat);
        } else {
          label = item[this.itemConfig.labelKey];
        }

        const disableClose = this.itemConfig.disableFirst && index === 0;
        return {
          ...item,
          value,
          label,
          disableClose
        };
      });

      this.$data._items = processedItems;

      // 自动选中第一项
      if (this.autoSelectFirst && processedItems.length > 0 && !this.internalValue) {
        const firstItem = processedItems[0];
        this.internalValue = firstItem.value;
        this.$emit('change', firstItem, 0);
      }
    },
    /**
     * 加载远程数据
     */
    async loadRemoteData () {
      // 是否有远程加载方法，加载数据
      if (!this.loadData && typeof this.loadData !== 'function') {
        return;
      }

      try {
        this.loading = true;
        const data = await this.loadData(this.loadParams);
        const _data = Array.isArray(data) ? data : data.records;
        this.initializeItems(_data || []);
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$emit('error', error);
      } finally {
        this.loading = false;
      }
    },
    /**
     * 手动刷新数据
     */
    async refresh() {
      await this.loadRemoteData();
    },
    // 回车
    onInputEnter() {
      const label = this.inputValue.trim();
      this.inputValue = '';
      // 完成输入
      if (label.length === 0) {
        this.$message.info('请输入内容');
        return;
      }
      // 新增时用custom_前缀区分
      const value = 'custom_' + label;
      this.onAdd(value, {
        [this.selectConfig.labelKey]: label,
        [this.selectConfig.valueKey]: value,
      });
    },
    // 手动更新布局
    updateLayout () {
      this.$refs.baseTabs.updateLayout();
    }
  }
};

</script>
