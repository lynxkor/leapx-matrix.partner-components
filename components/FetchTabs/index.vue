<script>
/*
  使用方式一：
  <fetch-tabs
    v-model="currentVehicleId"
    :loadParams="{freeMaintenancePolicyId: getId()}"
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
    :items="items"
    :value="internalValue"
    :closeTip="closeTip"
    @change="onTabChange"
    @close="onTabClose"
    >
    <template v-if="showAdd" slot="add-popover">
      <fetch-select
        filterable
        clearable
        remote
        reserve-keyword
        v-model="tabValue"
        :remote-method="onRemote"
        @change="onChange"
        :value-key="selectConfig.valueKey"
        :label-key="selectConfig.labelKey"
        :placeholder="selectConfig.placeholder"
      />
    </template>
  </base-tabs>
</template>
<script>

import BaseTabs from '../BaseTabs';
import FetchSelect from '../FetchSelect';
import { createDefer } from '../../utils/defer';

export default {
  components: {
    BaseTabs,
    FetchSelect,
  },
  props: {
    // 添加 value 支持 v-model
    value: {
      type: [String, Number],
      default: ''
    },
    // 是否显示添加功能
    showAdd: {
      type: Boolean,
      default: true,
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
      items: [],
      vehicleRegisteredModelId: '',
      tabValue: '',
    };
  },
  computed: {
    internalValue: {
      get () {
        return this.value || this.vehicleRegisteredModelId;
      },
      set (val) {
        this.vehicleRegisteredModelId = val; // 没有v-model情况生效
        this.$emit('input', val); // 使v-model生效
      }
    },
  },
  watch: {
    // 监听初始数据变化
    initialItems: {
      immediate: true,
      handler (newItems) {
        if (newItems && newItems.length > 0) {
          this.initializeItems(newItems);
        }
      }
    }
  },
  mounted () {
    this.initializeComponent();
  },
  methods: {
    getId () {
      const id = this.id || this.$route.query.id;
      return id;
    },
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
      this.items.splice(index, 1);
      const defer = createDefer();
      this.$emit('remove', item, index, defer);
      defer.promise.then(() => {}).catch((e) => {
        // 删除失败回退
        this.items.splice(rowIndex, 0, item);
      });

      // 4. 处理删除后的选中状态
      if (wasActive) {
        if (this.items.length > 0) {
          const firstItem = this.items[0];
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
      //     items: this.items,
      //     internalValue: this.internalValue,
      //     value: this.value
      //   });
      // }, 1000);
    },
    onRemote (query) {
      if (this.remoteMethod) {
        return this.remoteMethod(query);
      }
    },
    onChange (val, record) {
      if (val) {
        const fItem = this.items.find(item => item.value === val);
        if (fItem) {
          this.tabValue = '';
          this.$message.error('数据重复添加');
          return;
        }
        this.items.push({
          ...record,
          label: record[this.selectConfig.labelKey],
          value: record[this.selectConfig.valueKey],
        });
      }
      this.tabValue = '';
    },
    /**
     * 初始化组件
     */
    async initializeComponent () {
      // 如果有初始数据，使用初始数据
      if (this.initialItems && this.initialItems.length > 0) {
        this.initializeItems(this.initialItems);
        return;
      }
      // 如果有远程加载方法，加载数据
      if (this.loadData && typeof this.loadData === 'function') {
        await this.loadRemoteData();
      }
    },
    /**
     * 初始化 items
     */
    initializeItems (items = []) {
      const processedItems = items.map((item, index) => {
        const value = item[this.itemConfig.valueKey] || item.value || item.id;
        const label = item[this.itemConfig.labelKey] || item.label || item.name;

        const disableClose = this.itemConfig.disableFirst && index === 0;
        return {
          ...item,
          value,
          label,
          disableClose
        };
      });

      this.items = processedItems;

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
    },
  }
};

</script>
