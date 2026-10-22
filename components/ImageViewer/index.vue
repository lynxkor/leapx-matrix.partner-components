<template>
  <transition name="image-viewer-fade">
    <div
      v-if="visible"
      class="image-viewer-mask"
      @click.self="handleClose"
    >
      <!-- 左/右切换 -->
      <i
        v-if="list.length > 1"
        class="image-viewer-nav image-viewer-nav-prev"
        @click.stop="handlePrev"
      ><i class="el-icon-arrow-left"></i></i>
      <i
        v-if="list.length > 1"
        class="image-viewer-nav image-viewer-nav-next"
        @click.stop="handleNext"
      ><i class="el-icon-arrow-right"></i></i>

      <!-- 大图：用 flex 居中舞台承载，避免 absolute + margin 定位与 transform 冲突 -->
      <div class="image-viewer-stage">
        <img
          v-if="currentUrl && !loadError"
          :key="currentUrl"
          :src="currentUrl"
          class="image-viewer-img"
          :class="{ 'is-dragging': dragging }"
          :style="imgStyle"
          draggable="false"
          @mousedown="handleDragStart"
          @wheel.prevent="handleWheel"
          @load="handleLoad"
          @error="handleError"
        />
        <div v-else-if="loadError" class="image-viewer-tip">图片加载失败</div>
        <div v-else class="image-viewer-tip">图片加载中...</div>
      </div>

      <!-- 工具栏 -->
      <div class="image-viewer-toolbar" @mousedown.stop @click.stop>
        <el-tooltip popper-class="image-viewer-tooltip" content="缩小" placement="top">
          <i class="image-viewer-btn" @click="zoomOut"><i class="el-icon-zoom-out"></i></i>
        </el-tooltip>
        <el-tooltip popper-class="image-viewer-tooltip" content="放大" placement="top">
          <i class="image-viewer-btn" @click="zoomIn"><i class="el-icon-zoom-in"></i></i>
        </el-tooltip>
        <el-tooltip popper-class="image-viewer-tooltip" content="逆时针旋转" placement="top">
          <i class="image-viewer-btn" @click="rotateLeft"><i class="el-icon-refresh-left"></i></i>
        </el-tooltip>
        <el-tooltip popper-class="image-viewer-tooltip" content="顺时针旋转" placement="top">
          <i class="image-viewer-btn" @click="rotateRight"><i class="el-icon-refresh-right"></i></i>
        </el-tooltip>
        <el-tooltip popper-class="image-viewer-tooltip" content="还原" placement="top">
          <i class="image-viewer-btn" @click="handleReset"><i class="el-icon-full-screen"></i></i>
        </el-tooltip>
        <el-tooltip v-if="list.length > 1" popper-class="image-viewer-tooltip" content="上一张" placement="top">
          <i class="image-viewer-btn" @click="handlePrev"><i class="el-icon-arrow-left"></i></i>
        </el-tooltip>
        <el-tooltip v-if="list.length > 1" popper-class="image-viewer-tooltip" content="下一张" placement="top">
          <i class="image-viewer-btn" @click="handleNext"><i class="el-icon-arrow-right"></i></i>
        </el-tooltip>
        <el-tooltip popper-class="image-viewer-tooltip" content="关闭" placement="top">
          <i class="image-viewer-btn" @click="handleClose"><i class="el-icon-close"></i></i>
        </el-tooltip>
      </div>

      <!-- 页码 -->
      <div v-if="list.length > 1" class="image-viewer-index">
        {{ currentIndex + 1 }} / {{ list.length }}
      </div>

      <!-- 角度提示 -->
      <div v-if="rotate !== 0" class="image-viewer-angle">{{ rotate }}°</div>
    </div>
  </transition>
</template>

<script>
/**
 * 全屏图片查看器
 * 交互参考保修申请单附件图片预览（el-image 全屏预览），额外支持旋转
 * 支持：缩小 / 放大 / 逆时针旋转 / 顺时针旋转 / 还原 / 上一张 / 下一张 / 关闭
 * 快捷操作：滚轮缩放、鼠标拖拽移动、Esc 关闭、←/→ 切换、+/- 缩放
 */
const SCALE_MIN = 0.2;
const SCALE_MAX = 5;
const SCALE_STEP = 0.2;
const ROTATE_STEP = 90;

export default {
  name: 'ImageViewer',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    // 图片地址列表
    list: {
      type: Array,
      default: () => [],
    },
    // 当前图片索引（点击第几张缩略图就传对应下标）
    index: {
      type: Number,
      default: 0,
    },
  },
  data () {
    return {
      currentIndex: 0,
      scale: 1,
      rotate: 0,
      offsetX: 0,
      offsetY: 0,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      loadError: false,
    };
  },
  computed: {
    currentUrl () {
      return this.list[this.currentIndex] || '';
    },
    imgStyle () {
      return {
        transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale}) rotate(${this.rotate}deg)`,
      };
    },
  },
  watch: {
    visible (val) {
      if (val) {
        // 打开时重置为初始索引，并还原缩放/旋转
        this.currentIndex = this.clampIndex(this.index);
        this.loadError = false;
        this.handleReset();
        window.addEventListener('keydown', this.handleKeydown);
      } else {
        window.removeEventListener('keydown', this.handleKeydown);
      }
    },
    index (val) {
      if (this.visible) {
        this.currentIndex = this.clampIndex(val);
        this.loadError = false;
      }
    },
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeydown);
    this.removeDragListeners();
  },
  methods: {
    clampIndex (idx) {
      const max = this.list.length - 1;
      if (!Number.isFinite(idx) || idx < 0) return 0;
      return idx > max ? max : idx;
    },
    // 图片加载成功
    handleLoad () {
      this.loadError = false;
    },
    // 图片加载失败
    handleError () {
      this.loadError = true;
    },
    // 关闭
    handleClose () {
      this.removeDragListeners();
      this.dragging = false;
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    // 上一张
    handlePrev () {
      if (this.list.length <= 1) return;
      this.currentIndex = (this.currentIndex - 1 + this.list.length) % this.list.length;
      this.loadError = false;
      this.$emit('update:index', this.currentIndex);
    },
    // 下一张
    handleNext () {
      if (this.list.length <= 1) return;
      this.currentIndex = (this.currentIndex + 1) % this.list.length;
      this.loadError = false;
      this.$emit('update:index', this.currentIndex);
    },
    // 放大
    zoomIn () {
      this.scale = Math.min(SCALE_MAX, Number((this.scale + SCALE_STEP).toFixed(2)));
    },
    // 缩小
    zoomOut () {
      this.scale = Math.max(SCALE_MIN, Number((this.scale - SCALE_STEP).toFixed(2)));
    },
    // 逆时针旋转
    rotateLeft () {
      this.rotate = (this.rotate - ROTATE_STEP) % 360;
    },
    // 顺时针旋转
    rotateRight () {
      this.rotate = (this.rotate + ROTATE_STEP) % 360;
    },
    // 还原（缩放、旋转、位移全部复位）
    handleReset () {
      this.scale = 1;
      this.rotate = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    },
    // 滚轮缩放：以鼠标所在位置为中心做缩放
    handleWheel (e) {
      const prevScale = this.scale;
      const nextScale = e.deltaY < 0
        ? Math.min(SCALE_MAX, prevScale + SCALE_STEP)
        : Math.max(SCALE_MIN, prevScale - SCALE_STEP);
      if (nextScale === prevScale) return;

      // 缩放中心 = 鼠标相对图片中心的位置
      const rect = e.target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      const ratio = nextScale / prevScale;

      this.offsetX = mouseX - (mouseX - this.offsetX) * ratio;
      this.offsetY = mouseY - (mouseY - this.offsetY) * ratio;
      this.scale = nextScale;
    },
    // 开始拖拽
    handleDragStart (e) {
      this.dragging = true;
      this.dragStartX = e.clientX - this.offsetX;
      this.dragStartY = e.clientY - this.offsetY;
      window.addEventListener('mousemove', this.handleDragMove);
      window.addEventListener('mouseup', this.handleDragEnd);
    },
    // 拖拽中
    handleDragMove (e) {
      if (!this.dragging) return;
      this.offsetX = e.clientX - this.dragStartX;
      this.offsetY = e.clientY - this.dragStartY;
    },
    // 结束拖拽
    handleDragEnd () {
      this.dragging = false;
      this.removeDragListeners();
    },
    removeDragListeners () {
      window.removeEventListener('mousemove', this.handleDragMove);
      window.removeEventListener('mouseup', this.handleDragEnd);
    },
    // 键盘快捷键
    handleKeydown (e) {
      if (!this.visible) return;
      switch (e.key) {
        case 'Escape':
          this.handleClose();
          break;
        case 'ArrowLeft':
          this.handlePrev();
          break;
        case 'ArrowRight':
          this.handleNext();
          break;
        case '+':
        case '=':
          this.zoomIn();
          break;
        case '-':
          this.zoomOut();
          break;
        default:
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.image-viewer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  overflow: hidden;
  user-select: none;

  /* flex 居中承载大图，避免 absolute + margin 定位与 transform 相互干扰 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* 舞台铺满，但自身不拦截点击，点空白处才能关闭 */
  pointer-events: none;
}

.image-viewer-img {
  display: block;
  max-width: 90vw;
  max-height: 78vh;
  transform-origin: center center;
  cursor: grab;
  pointer-events: auto;

  &.is-dragging {
    cursor: grabbing;
  }
}

.image-viewer-tip {
  color: #fff;
  font-size: 14px;
  pointer-events: none;
}

.image-viewer-toolbar {
  position: absolute;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  z-index: 2;
}

.image-viewer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }
}

.image-viewer-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 66px;
  font-size: 24px;
  color: #fff;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  cursor: pointer;
  z-index: 2;
  transition: background-color 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.6);
  }
}

.image-viewer-nav-prev {
  left: 16px;
}

.image-viewer-nav-next {
  right: 16px;
}

.image-viewer-index {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  font-size: 14px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  z-index: 2;
}

.image-viewer-angle {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 4px 10px;
  font-size: 13px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  z-index: 2;
}

.image-viewer-fade-enter-active,
.image-viewer-fade-leave-active {
  transition: opacity 0.2s;
}

.image-viewer-fade-enter,
.image-viewer-fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* el-tooltip 的 popper 挂载在 body 上，需用 popper-class 在全局提层级，保证浮在遮罩之上 */
.el-tooltip__popper.image-viewer-tooltip {
  z-index: 10001 !important;
}
</style>