<template>
    <div>
        <el-drawer
            :visible.sync="drawer"
            @close="handleClose"
        >
            <div class="logistics-title-wrap">
                <h1 class="logistics-title">物流信息</h1>
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

                      <!-- 回单缩略图：展示在第一笔物流轨迹（时间最早的一笔）的明细与时间之间 -->
                      <div v-if="index === 0 && hasEpod" class="logistics-epod-thumbs">
                        <div
                          v-for="(url, epodIdx) in epodList"
                          :key="epodIdx"
                          class="logistics-epod-thumb"
                          @click="openEpodList(epodIdx)"
                        >
                          <img :src="url" alt="回单凭证" />
                        </div>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </div>
        </el-drawer>

        <!-- 回单图片全屏预览：交互参考保修申请单附件预览，支持缩小/放大/旋转 -->
        <image-viewer
          :visible.sync="epodListVisible"
          :list="epodList"
          :index="previewIndex"
        />
    </div>
</template>

<script>
import { getLogistics } from '@/api/common';
import ImageViewer from '@/libs/components/ImageViewer';

export default {
  components: {
    ImageViewer,
  },
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
      this.drawer = val;
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
      epodListVisible: false, // 回单图片全屏预览
      previewIndex: 0, // 当前预览索引
    };
  },
  computed: {
    hasEpod () {
      return Array.isArray(this.logisticsData.epod) && this.logisticsData.epod.length > 0;
    },
    epodList () {
      if (!this.hasEpod) return [];
      return this.logisticsData.epod.filter(url => !!url);
    }
  },
  methods: {

    // 关闭抽屉
    handleClose () {
      this.epodListVisible = false;
      this.$emit('update:visible', false);
    },
    // 点击缩略图：打开回单图片全屏预览（定位到该张）
    openEpodList (idx = 0) {
      this.previewIndex = idx;
      this.epodListVisible = true;
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
        this.logisticsData = res || {};
      } catch (error) {
        console.error('获取物流信息失败:', error);
        this.logisticsData = {};
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

.logistics-title-wrap {
  display: flex;
  align-items: center;
  margin-left: 12px;
  padding: 8px 0;

  .logistics-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin: 0;
  }
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

.logistics-epod-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.logistics-epod-thumb {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background-color: #f5f7fa;
  transition: border-color 0.2s;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: #67c23a;
  }
}
</style>
