<template>
    <div>
        <el-drawer
            :visible.sync="drawer"
            @close="handleClose"
        >
            <div style="margin-left: 12px;">
                <h1>物流信息</h1>
            </div>
            <div class="common-section-body">
              <div v-if="loadingLogistics" class="loading">
                <el-loading-spinner></el-loading-spinner>
                正在加载物流信息...
              </div>
              <div v-else-if="!logisticsData" class="no-data">
                暂无物流信息
              </div>
              <div v-else class="logistics-container">
                <!-- 运单号和预计送达时间 -->
                <div class="logistics-header">
                  <span class="label">运单号：</span>
                  <span class="value">{{ logisticsData.waybillCode }}</span>
                  <span class="label">预计送达日期：</span>
                  <span class="value">{{ logisticsData.promiseAgingDate }}</span>
                </div>

                <!-- 物流节点 -->
                <el-timeline>
                  <el-timeline-item
                    v-for="(item, index) in logisticsData.traceDetails"
                    :key="index"
                    :timestamp="item.time"
                    :color="'#007fff'"
                    :type="'info'"
                  >
                    <div class="timeline-content">
                      <strong>{{ item.context }}</strong>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
        </el-drawer>
    </div>
</template>

<script>
import { getLogistics } from '../../api/common';

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    drawerData: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    visible (val) {
      if (val) {
        this.drawer = val;
      }
    },
    drawerData (val) {
      if (val) {
        this.getLogisticsInfo(val.logisticsOrderNo, val.logisticsProvider);
      }
    }
  },
  data () {
    return {
      drawer: false,
      logisticsData: {},
      loadingLogistics: false, // 物流信息加载状态
    };
  },
  methods: {
    // 关闭抽屉
    handleClose () {
      this.$emit('update:visible', false);
    },
    // 物流信息接口
    async getLogisticsInfo (logisticsOrderNo, logisticsProvider) {
      this.loadingLogistics = true;
      const params = {
        waybillCode: logisticsOrderNo,
        logisticsType: logisticsProvider,
      };
      try {
        const res = await getLogistics(params);
        this.logisticsData = res;
      } catch (error) {
        console.error('获取物流信息失败:', error);
      } finally {
        this.loadingLogistics = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.common-section-body {
    margin-left: 16px;
}

.logistics-container {
  margin: 16px 0 0 16px;
}

.logistics-header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 14px;
}

.label {
  font-weight: bold;
  color: #333;
}

.value {
  color: #666;
}

.timeline-content {
  strong {
    display: block;
    margin-bottom: 4px;
  }
}

</style>
