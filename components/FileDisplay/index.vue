<template>
  <div class="file-display-container">
    <transition-group name="file-list" tag="div" class="file-list-wrapper">
      <div
        v-for="(file, index) in fileList"
        :key="file.url + index"
        class=""
        :class="{
          'file-item-image': isImageFile(file),
          'file-item-video': isVideoFile(file),
          'file-item-document': !isImageFile(file) && !isVideoFile(file)
        }"
      >
        <!-- 图片 -->
        <div v-if="isImageFile(file)" class="file-item-content">
          <div class="file-thumbnail square-thumbnail">
            <el-image
              :ref="`imageRef_${index}`"
              :src="file.url"
              :alt="file.name"
              fit="contain"
              lazy
              :preview-src-list="imagePreviewList"
              :initial-index="getImageIndex(file)"
              style="width: 100%; height: 100%; cursor: pointer;"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>

            <!-- 遮罩层 - 只在非展示模式下显示 -->
            <div v-if="!viewOnly" class="file-actions-mask">
              <div class="file-actions-container" :class="{'two-actions': !editable, 'four-actions': editable}">
                <el-tooltip content="查看" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-view"
                    size="small"
                    @click.stop="handleViewImage(file, index)"
                  />
                </el-tooltip>
                <el-tooltip content="下载" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-download"
                    size="small"
                    @click.stop="handleDownload(file)"
                  />
                </el-tooltip>
                <el-tooltip v-if="editable" content="删除" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    size="small"
                    @click.stop="handleDelete(file, index)"
                  />
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span>{{ file.name }}</span>
            </div>
          </div>
        </div>

        <!-- 视频 -->
        <div v-else-if="isVideoFile(file)" class="file-item-content">
          <div class="file-thumbnail square-thumbnail">
            <div class="video-thumbnail">
              <!-- 视频缩略图 -->
              <div class="video-preview" v-if="file.thumbnailUrl">
                <img :src="file.thumbnailUrl" alt="视频缩略图" class="thumbnail-image">
              </div>
              <!-- 播放图标 -->
              <div class="video-play-btn">
                <img :src="require('./video.png')" alt="">
              </div>
              <ais-video />
              <video
                :ref="`videoPlayer_${index}`"
                :src="file.url"
                preload="metadata"
                crossOrigin="anonymous"
                style="display: none"
                @loadeddata="captureFirstFrame(file, index)"
              ></video>
            </div>

            <!-- 遮罩层 -->
            <div v-if="!viewOnly" class="file-actions-mask">
              <div class="file-actions-container" :class="{'two-actions': !editable, 'four-actions': editable}">
                <el-tooltip content="播放" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-video-play"
                    size="small"
                    @click.stop="handleVideo(file)"
                  />
                </el-tooltip>
                <el-tooltip content="下载" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-download"
                    size="small"
                    @click.stop="handleDownload(file)"
                  />
                </el-tooltip>
                <el-tooltip v-if="editable" content="删除" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    size="small"
                    @click.stop="handleDelete(file, index)"
                  />
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span>{{ file.name }}</span>
            </div>
          </div>
        </div>

        <!-- 文件 -->
        <div v-else class="file-item-content">
          <div class="file-thumbnail square-thumbnail">
            <i class="el-icon-document file-icon"></i>

            <!-- 遮罩层 - 只在非展示模式下显示 -->
            <div v-if="!viewOnly" class="file-actions-mask">
              <div class="file-actions-container" :class="{'two-actions': !editable, 'four-actions': editable}">
                <el-tooltip content="下载" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-download"
                    size="small"
                    @click.stop="handleDownload(file)"
                  />
                </el-tooltip>
                <el-tooltip v-if="editable" content="删除" placement="top">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    size="small"
                    @click.stop="handleDelete(file, index)"
                  />
                </el-tooltip>
              </div>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span>{{ file.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import AisVideo from '../AisVideo/index.vue';

export default {
  name: 'FileDisplay',
  components: {
    AisVideo
  },
  props: {
    // 文件列表
    fileList: {
      type: Array,
      default: () => []
    },

    // 是否可编辑（重命名、删除）
    editable: {
      type: Boolean,
      default: true
    },

    // 是否禁用所有操作
    disabled: {
      type: Boolean,
      default: false
    },

    // 自定义文件类型检测函数
    fileTypeDetector: {
      type: Function,
      default: null
    },

    // 是否为只展示模式（不显示操作遮罩层）
    viewOnly: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    // 获取所有图片的预览列表
    imagePreviewList () {
      const urls = [];
      this.fileList.forEach(file => {
        const isImage = this.isImageFile(file);
        if (isImage && file.url) {
          urls.push(file.url);
        }
      });
      console.log(this.fileList);
      return urls;
    }
  },

  methods: {
    // 判断是否为图片文件
    isImageFile (file) {
      if (!file) return false;
      // 从文件类型字段判断
      const fileType = (file.fileType || '').toLowerCase();
      const imageTypes = ['image', 'img', 'picture', 'photo', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
      if (imageTypes.includes(fileType)) {
        return true;
      }
      // 从文件名后缀判断
      const fileName = file.name || '';
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
      const lowerFileName = fileName.toLowerCase();
      return imageExtensions.some(ext => lowerFileName.endsWith(ext));
    },

    // 判断是否为视频文件
    isVideoFile (file) {
      if (!file) return false;
      // 从文件类型字段判断
      const fileType = (file.fileType || '').toLowerCase();
      const videoTypes = ['video', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg'];
      if (videoTypes.includes(fileType)) {
        return true;
      }
      // 从文件名后缀判断
      const fileName = file.name || '';
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.mpeg', '.mpg'];
      const lowerFileName = fileName.toLowerCase();
      return videoExtensions.some(ext => lowerFileName.endsWith(ext));
    },

    // 检测文件类型
    detectFileType (file) {
      if (this.fileTypeDetector) {
        return this.fileTypeDetector(file);
      }

      const name = file.name || '';
      const url = file.url || '';
      const lowerName = name.toLowerCase();
      const lowerUrl = url.toLowerCase();

      // 图片类型
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      // 视频类型
      const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'];

      // 检查文件名
      for (const ext of imageExtensions) {
        if (lowerName.endsWith(ext) || lowerUrl.includes(ext)) {
          return 'image';
        }
      }

      for (const ext of videoExtensions) {
        if (lowerName.endsWith(ext) || lowerUrl.includes(ext)) {
          return 'video';
        }
      }

      // 根据文件内容类型判断
      const type = file.type || file.raw?.type || '';
      if (type.startsWith('image/')) return 'image';
      if (type.startsWith('video/')) return 'video';

      return 'file';
    },

    // 格式化文件大小
    formatFileSize (size) {
      if (!size) return '';
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
      if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
      return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    },

    // 获取当前图片在预览列表中的索引
    getImageIndex (file) {
      if (file.fileType !== 'image') return 0;

      const imageUrl = file.url || file.thumbUrl;
      if (!imageUrl) return 0;

      return this.imagePreviewList.findIndex(url => url === imageUrl);
    },

    // 通过"查看"按钮触发图片预览
    handleViewImage (file, index) {
      if (this.disabled) return;
      this.$nextTick(() => {
        const imageRef = this.$refs[`imageRef_${index}`]?.[0];
        if (imageRef && typeof imageRef.clickHandler === 'function') {
          imageRef.clickHandler();
        }
      });
    },
    // 处理视频播放
    handleVideo (file) {
      this.$video.show({
        url: file.url,
        title: file.name
      });
    },

    // 下载文件
    handleDownload (file) {
      const { url, name } = file;
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          // 创建 blob URL
          const blobUrl = URL.createObjectURL(blob);

          // 创建下载链接
          const link = document.createElement('a');
          link.href = blobUrl;

          // 确保文件名有正确的扩展名
          link.download = name;

          // 添加到文档并触发下载
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // 清理 blob URL 释放内存
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        })
        .catch(error => {
          console.error('图片下载失败:', error);
          // 降级方案：尝试直接使用原始URL
          const link = document.createElement('a');
          link.href = url;
          link.download = name;
          link.target = '_blank'; // 新窗口打开作为备选
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
    },

    // 删除文件
    handleDelete (file, index) {
      if (!this.editable || this.disabled) return;
      this.$emit('delete', {
        file,
        index
      });
    },

    // 视频预览（保留原有的视频预览逻辑）
    handlePreview (file) {
      if (this.disabled) return;
      this.$emit('preview', file);
    },
    // 捕获视频第一帧
    captureFirstFrame (file, index) {
      if (file.thumbnailUrl) {
        return; // 已经有缩略图，跳过
      }
      const video = this.$refs[`videoPlayer_${index}`]?.[0];

      // 确保视频已加载足够数据
      if (video.readyState < 2) {
        video.currentTime = 0.1; // 设置到第0.1秒（有些视频第0秒是黑帧）
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 设置canvas尺寸（可以调整缩略图大小）
      canvas.width = 120;
      canvas.height = 120;

      // 绘制视频帧到canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 将canvas转换为DataURL
      try {
        const url = canvas.toDataURL('image/jpeg', 0.8);
        this.$set(file, 'thumbnailUrl', url);
      } catch (error) {
        console.error('生成缩略图失败:', error);
      }
    },
  }
};
</script>

<style lang="scss" scoped>
.file-display-container {
  width: 100%;
}

.file-list-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.file-item {
  width: 140px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 8px 8px 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: visible;

  &:hover {
    border-color: var(--leap-color-primary);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
    transform: translateY(-2px);
  }

  &.file-item-image {
    .file-thumbnail {
      background: #f5f7fa;
      border: 1px solid #ebeef5;
    }
  }

  &.file-item-video {
    .file-thumbnail {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
    }
  }

  &.file-item-document {
    .file-thumbnail {
      background: #fef0f0;
      border: 1px solid #fde2e2;
    }
  }
}

// file-item-content 不包含任何样式
.file-item-content {
  width: 120px;
}

// 方形缩略图样式 - 放大图片
.square-thumbnail {
  background: #fff;
  border: 1px solid #e4e7ed;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;

  i {
    font-size: 32px;
  }
}

// 改进的视频缩略图样式
.video-thumbnail {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;

  .video-play-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    transition: all 0.2s ease;
    img{
      width: 100%;
      height: 100%;
    }
  }

  .video-preview {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    cursor: pointer;
  }
}

.file-icon {
  font-size: 40px;
  color: #409eff;
}

.file-info {
  width: 100%;
  text-align: center;
  padding: 0 4px;
}

.file-name {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  min-height: 32px; // 确保两行文字的高度
}

// 避免在只展示模式下出现悬停效果 - 颜色调整为更淡
.file-display-container.view-only {
  .file-item {
    &:hover {
      border-color: #dcdfe6; /* 更淡的边框颜色 */
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04); /* 更淡的阴影 */
      transform: translateY(0);
      cursor: default;
    }
  }
}

// 遮罩层样式 - 在 square-thumbnail 内部
.file-actions-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
}

// 鼠标悬停时显示遮罩
.square-thumbnail:hover .file-actions-mask {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.file-actions-container {
  &.two-actions {
    display: flex;
    gap: 24px;

    ::v-deep .el-button {
      padding: 8px;
      color: white;
      font-size: 18px;
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover:not([disabled]) {
        color: white;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
      }

      &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  &.four-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 16px;
    width: 80px;
    height: 80px;

    ::v-deep .el-button {
      padding: 6px;
      color: white;
      font-size: 16px;
      background: transparent;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      margin: 0;

      &:hover:not([disabled]) {
        color: white;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(1.1);
      }

      &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.file-list-enter-active,
.file-list-leave-active {
  transition: all 0.3s ease;
}

.file-list-enter,
.file-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
