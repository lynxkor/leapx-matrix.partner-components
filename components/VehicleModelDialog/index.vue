<template>
  <el-dialog
    :title="title"
    :visible="visible"
    width="60%"
    append-to-body
    @close="handleClose"
  >
    <div class="selection-container">
      <div class="selection-section">
        <div class="section-title">车系</div>
        <div class="selection-items">
          <div
            v-for="(series, index) in seriesList"
            :key="'series-' + index"
            :class="['selection-item', { selected: selectedSeriesIndex === index }]"
            @click="selectSeries(index, series)"
          >
            {{ series.seriesName }}
          </div>
        </div>
      </div>
      <div class="selection-section">
        <div class="section-title">年款</div>
        <div class="selection-items">
          <div
            v-for="(year, index) in yearList"
            :key="'year-' + index"
            :class="['selection-item', { selected: selectedYearIndex === index }]"
            @click="selectYear(index, year)"
          >
            {{ year.name }}
          </div>
        </div>
      </div>
      <div class="selection-section">
        <div class="section-title">车型</div>
        <div class="selection-items">
          <div
            v-for="(model, index) in applicableModelList"
            :key="'model-' + index"
            :class="['selection-item', { selected: selectedModelIndex === index || isModelDisabled(model), disabled: isModelDisabled(model) }]"
            @click="handleModelClick(index, model)"
          >
            {{ model.modelName }}
          </div>
        </div>
      </div>
    </div>

    <el-divider></el-divider>

    <div class="table-container">
      <vxe-table
        ref="tableRef"
        :data="tableData"
        stripe
        show-overflow
        resizable
        border="inner"
        size="medium"
        max-height="400"
      >
        <vxe-column type="seq" title="序号" width="80" align="center" />
        <vxe-column field="vehicleSeriesName" title="车系" width="150" align="center" />
        <vxe-column field="vehicleModelName" title="适用车型" align="center" />
        <vxe-column field="vehicleYearTypeName" title="年款" width="150" align="center" />
        <vxe-column title="操作" width="120" align="center" fixed="right">
          <template #default="{ rowIndex }">
            <span class="action-delete" @click="handleDelete(rowIndex)">删除</span>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="handleClose">取消</el-button>
      <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { listVehicleSeries, listVehicleYearTypeFull, listVehicleYearType } from '@/api/common';

export default {
  name: 'VehicleModelDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: '维护车型'
    }
  },
  data () {
    return {
      seriesList: [],
      selectedSeriesIndex: 0,
      yearList: [],
      selectedYearIndex: 0,
      yearDetail: {},
      applicableModelList: [],
      selectedModelIndex: null,
      tableData: []
    };
  },
  computed: {
    existingKeys () {
      return new Set(
        this.tableData.map(item => `${item.vehicleSeriesId}_${item.vehicleYearTypeId}_${item.vehicleModelId}`)
      );
    }
  },
  watch: {
    visible: {
      handler (val) {
        if (val) {
          this.init();
        }
      }
    }
  },
  methods: {
    async init () {
      this.tableData = this.initialData ? this.initialData.map(item => ({
        ...item,
        vehicleYearTypeName: item.vehicleYearType || item.vehicleYearTypeName,
      })) : [];
      await this.getVehicleList();
      await this.getYearList();
    },
    async getVehicleList () {
      const res = await listVehicleSeries({ status: 1, pageSize: 1000 });
      this.seriesList = res || [];
      if (this.seriesList.length > 0) {
        this.selectedSeriesIndex = 0;
        await this.getModelList(this.seriesList[0].id);
      }
    },
    async getYearList () {
      const res = await listVehicleYearType({ status: 1, pageSize: 1000 });
      this.yearList = [{ id: 0, name: '无年款' }, ...(res || [])];
      this.selectedYearIndex = 0;
      this.yearDetail = {
        vehicleYearTypeId: this.yearList[0].id,
        vehicleYearTypeName: this.yearList[0].name
      };
    },
    async getModelList (seriesId) {
      const res = await listVehicleYearTypeFull({ seriesId: seriesId, status: 1, pageSize: 1000 });
      const list = res || [];
      this.applicableModelList = list.sort((a, b) => {
        const numA = (a.modelName.match(/-(\d+)/) || [])[1] || '';
        const numB = (b.modelName.match(/-(\d+)/) || [])[1] || '';
        return numA.localeCompare(numB, undefined, { numeric: true });
      });
      this.selectedModelIndex = null;
    },
    selectSeries (index, series) {
      this.selectedSeriesIndex = index;
      this.selectedModelIndex = null;
      this.getModelList(series?.id);
    },
    selectYear (index, year) {
      if (this.selectedYearIndex === index) {
        this.selectedYearIndex = null;
        this.yearDetail = {};
      } else {
        this.selectedYearIndex = index;
        this.yearDetail = {
          vehicleYearTypeId: year?.id,
          vehicleYearTypeName: year?.name
        };
      }
      this.selectedModelIndex = null;
    },
    isModelDisabled (model) {
      const key = `${model.seriesId}_${this.yearDetail.vehicleYearTypeId}_${model.id}`;
      return this.existingKeys.has(key);
    },
    handleModelClick (index, model) {
      if (this.isModelDisabled(model)) return;
      this.selectedModelIndex = index;

      const newRow = {
        vehicleModelId: model.id,
        vehicleModelName: model.modelName,
        vehicleSeriesId: model.seriesId,
        vehicleSeriesName: model.seriesName,
        vehicleModelDesc: model.remark,
        vehicleYearTypeId: this.yearDetail.vehicleYearTypeId,
        vehicleYearType: this.yearDetail.vehicleYearTypeName,
        vehicleYearTypeName: this.yearDetail.vehicleYearTypeName,
      };
      this.tableData.push(newRow);
    },
    handleDelete (index) {
      this.tableData.splice(index, 1);
    },
    handleConfirm () {
      this.$emit('confirm', this.tableData);
      this.$emit('close');
      this.resetState();
    },
    handleClose () {
      this.$emit('close');
      this.resetState();
    },
    resetState () {
      this.tableData = [];
      this.selectedModelIndex = null;
      this.selectedSeriesIndex = 0;
      this.selectedYearIndex = 0;
      this.yearDetail = {};
      this.applicableModelList = [];
    }
  }
};
</script>

<style scoped>
.selection-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  white-space: nowrap;
  font-size: 14px;
  margin-right: 12px;
  color: #333;
}

.selection-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selection-item {
  padding: 5px 16px;
  border: 1px solid #E6E6E5;
  border-radius: 4px;
  background-color: #ffffff;
  color: #3B3E3B;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  user-select: none;
}

.selection-item:hover {
  color: var(--themColor);
  background-color: #fff;
  border-color: var(--themColor);
}

.selection-item.selected {
  background-color: var(--leap-color-primary);
  border: 1px solid var(--leap-color-primary);
  color: #fff;
  border-radius: 4px;
}

.table-container {
  margin-top: 10px;
}

.action-delete {
  color: #B91919;
  cursor: pointer;
}

.action-delete:hover {
  color: #f56c6c;
}

.dialog-footer {
  text-align: right;
}
</style>
