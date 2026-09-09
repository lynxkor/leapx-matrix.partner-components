<template>
    <div>
        <el-drawer
            :visible.sync="drawer"
            @close="handleClose"
        >
            <div class="logistics-title-wrap">
                <h1 class="logistics-title">物流信息</h1>
                <el-button
                  v-if="hasEpod"
                  type="success"
                  plain
                  size="mini"
                  class="epod-btn"
                  @click="openEpodList"
                >回单凭证</el-button>
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

        <div
          v-if="epodListVisible"
          class="epod-list-mask"
          @click.self="closeEpodList"
        >
          <div class="epod-list-panel">
            <div class="epod-list-header">
              <span class="epod-list-title">回单凭证（{{ previewIndex + 1 }} / {{ epodList.length }}）</span>
              <span class="epod-list-close" @click="closeEpodList">×</span>
            </div>
            <div class="epod-list-body">
              <div class="epod-list-main">
                <img
                   :src="epodList[previewIndex]"
                   class="epod-list-main-img"
                   alt="回单凭证"
                   @click="openPreview(previewIndex)"
                 />
              </div>
              <div class="epod-list-thumbs">
                <div
                  v-for="(url, idx) in epodList"
                  :key="idx"
                  :class="['epod-thumb', { active: idx === previewIndex }]"
                  @click="setPreviewIndex(idx)"
                >
                  <img :src="url" alt="回单凭证" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="previewVisible"
          class="epod-preview-mask"
          @click.self="closePreview"
        >
          <span class="epod-preview-close" @click="closePreview">×</span>
          <img
            :src="epodList[previewIndex]"
            class="epod-preview-img"
            alt="回单凭证"
          />
        </div>
    </div>
</template>

<script>
import { getLogistics } from '@/api/common';

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
      epodListVisible: false, // 回单凭证列表弹框
      previewVisible: false, // 全屏预览
      previewIndex: 0, // 全屏预览当前索引
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
      this.previewVisible = false;
      this.$emit('update:visible', false);
    },
    // 打开回单列表弹框
    openEpodList () {
      this.epodListVisible = true;
    },
    // 关闭回单列表弹框
    closeEpodList () {
      this.epodListVisible = false;
    },
    // 切换当前大图
    setPreviewIndex (idx) {
      this.previewIndex = idx;
    },
    // 打开全屏预览
    openPreview (idx) {
      this.previewIndex = idx;
      this.previewVisible = true;
    },
    // 关闭全屏预览
    closePreview () {
      this.previewVisible = false;
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

  .epod-btn {
    margin-left: 12px;
    border-color: #67c23a;
    color: #67c23a;
    background-color: #fff;

    &:hover,
    &:focus {
      background-color: #fff;
      border-color: #67c23a;
      color: #67c23a;
    }
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

.epod-list-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.epod-list-panel {
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  background: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.epod-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.epod-list-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.epod-list-close {
  font-size: 24px;
  color: #909399;
  cursor: pointer;
  line-height: 1;
  user-select: none;
}

.epod-list-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
}

.epod-list-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
  min-height: 300px;
  max-height: 55vh;
  margin-bottom: 12px;
  cursor: zoom-in;
}

.epod-list-main-img {
  display: block;
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
}

.epod-list-thumbs {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px;
}

.epod-thumb {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  border: 2px solid transparent;
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

  &.active {
    border-color: #67c23a;
  }

  &:hover {
    border-color: #b3e19d;
  }
}

.epod-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.epod-preview-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  display: block;
}

.epod-preview-close {
  position: fixed;
  top: 20px;
  right: 30px;
  font-size: 36px;
  color: #fff;
  cursor: pointer;
  line-height: 1;
  user-select: none;
}

</style>
