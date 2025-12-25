<script>
/*
  使用方式一：
  <fetch-tabs
    v-model="currentVehicleId"
    :loadParams="{freeMaintenancePolicyId: _id}"
    :loadData="loadData"
    :itemConfig="{
      valueKey: 'vehicleRegisteredModelId',
      labelKey: 'vehicleRegisteredModelName',
      disableCloseKey: 'disableClose',
      disableFirst: true,
    }"
    closeTip="确定删除该公共车型吗？"
    :remoteMethod="remoteMethod"
    :selectConfig="{
      valueKey: 'id',
      labelKey: 'registeredModelName',
      placeholder: '请输入公告车型代码/名称',
    }"
  />

  data() {
    return {
      currentVehicleId: '',
    }
  },
  methods: {
    loadData (params) {
      return freeMaintenancePolicyPartDetailList(params);
    },
    remoteMethod (query) {
      return vehicleSalesVersionList({
        registeredModelNameLike: query,
        pageSize: 20,
        pageNum: 1,
      });
    },
  }
  */
</script>

<template>
  <base-tabs
    :type="type"
    :items="$data._items"
    :value="internalValue"
    :closeTip="closeTip"
    :disabled="disabled"
    @change="onTabChange"
    @close="onTabClose"
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
import { debounce } from '../../utils';
import BaseInput from '../BaseInput';

export default {
  components: {
    BaseTabs,
    FetchSelect,
    BaseInput,
  },
  props: {
    // 展示类型
    type: {
      type: 'normal' | 'menu' | 'rect',
      default: 'normal',
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
    // 数据映射配置
    itemConfig: {
      type: Object,
      default: () => ({
        valueKey: 'id',
        labelKey: 'name',
        disableCloseKey: 'disableClose',
        disableFirst: true,
      })
    },
    // 搜索获取下拉数据
    remoteMethod: {
      type: Function,
      default: null
    },
    // 下拉选择配置
    selectConfig: {
      type: Object,
      default: () => ({
        valueKey: 'id',
        labelKey: 'name',
        placeholder: '请选择',
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
    // 监听初始数据变化
    items: {
      immediate: true,
      handler (newItems) {
        this.initializeItems(newItems);
      }
    },
    loadParams: {
      handler () {
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
      defer.promise.then(() => {}).catch((e) => {
        // 删除失败回退
        this.$data._items.splice(rowIndex, 0, item);
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

      // // 添加调试，检查 LeapTabs 组件是否接收到新值
      // setTimeout(() => {
      //   console.log('Current tabs state:', {
      //     items: this.$data._items,
      //     internalValue: this.internalValue,
      //     value: this.value
      //   });
      // }, 1000);
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
        this.$data._items.push({
          ...record,
          label: record[this.selectConfig.labelKey],
          value: record[this.selectConfig.valueKey],
        });
      }
      this.selectValue = '';
    },
    /**
     * 初始化 items
     */
    initializeItems (data = []) {
      if (!Array.isArray(data) || data.length === 0) {
        return;
      }
      const processedItems = data.map((item, index) => {

        const value = item[this.itemConfig.valueKey];
        const label = item[this.itemConfig.labelKey];

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
    loadRemoteData: debounce(async function() {
      // 是否有远程加载方法，加载数据
      if (!this.loadData && typeof this.loadData !== 'function') {
        return;
      }

      try {
        this.loading = true;
        const data = await this.loadData(this.loadParams);
        this.initializeItems(data || []);
      } catch (error) {
        console.error('加载数据失败:', error);
        this.$emit('error', error);
      } finally {
        this.loading = false;
      }
    }, 300),
    /**
     * 手动刷新数据
     */
    async refresh() {
      await this.loadRemoteData();
    },
    // 回车
    onInputEnter() {
      const val = this.inputValue.trim();
      this.inputValue = '';
      // 完成输入
      if (val.length === 0) {
        this.$message.info('请输入内容');
        return;
      }
      this.$data._items.push({
        label: val,
        value: val,
      });
      this.$emit('input-complete', val);
    }
  }
};

</script>
