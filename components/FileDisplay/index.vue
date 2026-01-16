<template>
  <div class="file-display-container">
    <transition-group name="file-list" tag="div" class="file-list-wrapper">
      <div
        v-for="(file, index) in fileList"
        :key="file.uid || `${file.name}-${index}`"
        class="file-item"
        :class="{
          'file-item-image': file.fileType === 'image',
          'file-item-video': file.fileType === 'video',
          'file-item-document': file.fileType === 'file' || !file.fileType
        }"
      >
        <!-- 图片类型展示 -->
        <div v-if="isImageFile(file)" class="file-item-content">
          <div class="file-thumbnail">
            <el-image
              :ref="`imageRef_${index}`"
              :src="file.url || file.thumbUrl"
              :alt="file.name"
              fit="cover"
              lazy
              :preview-src-list="imagePreviewList"
              :initial-index="getImageIndex(file)"
              style="width: 100%; height: 100%; cursor: pointer;"
              @click="handleImageClick($event, file, index)"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
              </div>
            </el-image>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span v-if="!file.editing">{{ file.name }}</span>
              <el-input
                v-else
                ref="renameInputRefs"
                v-model="file.editName"
                size="small"
                @blur="handleRenameConfirm(file, index)"
                @keyup.enter="handleRenameConfirm(file, index)"
              />
            </div>
            <div class="file-size" v-if="file.size">{{ formatFileSize(file.size) }}</div>
          </div>

          <!-- 遮罩层 - 只在非展示模式下显示 -->
          <div v-if="!viewOnly" class="file-actions-mask">
            <div class="file-actions-container">
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
              <!-- <el-tooltip v-if="editable" content="重命名" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-edit"
                  size="small"
                  @click.stop="handleRename(file, index)"

                />
              </el-tooltip> -->
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

        <!-- 视频类型展示 -->
        <div v-else-if="isVideoFile(file)" class="file-item-content">
          <div class="file-thumbnail">
            <div class="video-thumbnail">
              <!-- 改进的视频播放图标设计 -->
              <div class="video-play-btn">
                <i class="el-icon-video-play"></i>
              </div>
              <div class="video-overlay" @click="handleDownload(file)"></div>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span v-if="!file.editing">{{ file.name }}</span>
              <el-input
                v-else
                ref="renameInputRefs"
                v-model="file.editName"
                size="small"
                @blur="handleRenameConfirm(file, index)"
                @keyup.enter="handleRenameConfirm(file, index)"
              />
            </div>
            <div class="file-size" v-if="file.size">{{ formatFileSize(file.size) }}</div>
          </div>

          <!-- 遮罩层 - 只在非展示模式下显示 -->
          <div v-if="!viewOnly" class="file-actions-mask">
            <div class="file-actions-container">
              <el-tooltip content="播放" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-video-play"
                  size="small"
                  @click.stop="handleDownload(file)"

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
              <!-- <el-tooltip v-if="editable" content="重命名" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-edit"
                  size="small"
                  @click.stop="handleRename(file, index)"

                />
              </el-tooltip> -->
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

        <!-- 文件类型展示 -->
        <div v-else class="file-item-content">
          <div class="file-thumbnail">
            <i class="el-icon-document file-icon"></i>
          </div>
          <div class="file-info">
            <div class="file-name">
              <span v-if="!file.editing">{{ file.name }}</span>
              <el-input
                v-else
                ref="renameInputRefs"
                v-model="file.editName"
                size="small"
                @blur="handleRenameConfirm(file, index)"
                @keyup.enter="handleRenameConfirm(file, index)"
              />
            </div>
            <div class="file-size" v-if="file.size">{{ formatFileSize(file.size) }}</div>
          </div>

          <!-- 遮罩层 - 只在非展示模式下显示 -->
          <div v-if="!viewOnly" class="file-actions-mask">
            <div class="file-actions-container">
              <el-tooltip content="下载" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-download"
                  size="small"
                  @click.stop="handleDownload(file)"

                />
              </el-tooltip>
              <!-- <el-tooltip v-if="editable" content="重命名" placement="top">
                <el-button
                  type="text"
                  icon="el-icon-edit"
                  size="small"
                  @click.stop="handleRename(file, index)"

                />
              </el-tooltip> -->
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
      </div>
    </transition-group>
  </div>
</template>

<script>
export default {
  name: 'FileDisplay',

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

  data () {
    return {
      internalFileList: []
    };
  },

  computed: {
    // 获取所有图片的预览列表
    imagePreviewList () {
      return this.fileList
        .filter(file => file.fileType === 'image')
        .map(file => file.url || file.thumbUrl)
        .filter(url => url); // 过滤掉空URL
    }
  },

  watch: {
    fileList: {
      immediate: true,
      handler (newVal) {
        this.internalFileList = this.processFileList(newVal);
      }
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
    // 处理文件列表
    processFileList (fileList) {
      return fileList.map(file => {
        return {
          ...file,
          fileType: file.fileType || this.detectFileType(file),
          editing: false,
          editName: file.name
        };
      });
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

    // 处理图片点击事件
    handleImageClick (event, file, index) {
      if (this.disabled) return;
      // 阻止事件冒泡，避免触发其他操作
      event.stopPropagation();
      // 调用el-image的clickHandler方法
      this.triggerImagePreview(index);
    },

    // 通过"查看"按钮触发图片预览
    handleViewImage (file, index) {
      if (this.disabled) return;
      this.triggerImagePreview(index);
    },

    // 触发el-image预览的方法
    triggerImagePreview (index) {
      this.$nextTick(() => {
        const imageRef = this.$refs[`imageRef_${index}`];
        if (imageRef && imageRef[0]) {
          // 调用el-image组件的clickHandler方法
          if (typeof imageRef[0].clickHandler === 'function') {
            imageRef[0].clickHandler();
          } else {
            // 如果clickHandler不可用，尝试其他方式
            const imageInstance = imageRef[0];
            if (imageInstance.showViewer) {
              imageInstance.showViewer();
            }
          }
        }
      });
    },

    // 下载文件
    handleDownload (file) {
      window.open(file.response.fileUrl);
    },

    // 重命名文件
    handleRename (file, index) {
      if (!this.editable || this.disabled) return;

      this.internalFileList.forEach((f, i) => {
        if (i !== index) {
          f.editing = false;
        }
      });

      file.editing = true;
      file.editName = file.name;

      this.$nextTick(() => {
        const inputRef = this.$refs.renameInputRefs;
        if (inputRef && inputRef[index]) {
          inputRef[index].focus();
        }
      });
    },

    // 确认重命名
    handleRenameConfirm (file, index) {
      if (!file.editName || file.editName.trim() === '') {
        this.$message.warning('文件名不能为空');
        return;
      }

      if (file.editName === file.name) {
        file.editing = false;
        return;
      }

      const oldName = file.name;
      file.name = file.editName;
      file.editing = false;

      this.$emit('rename', {
        file,
        index,
        oldName,
        newName: file.name
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
    }
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
  gap: 12px;
}

.file-item {
  width: 300px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

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

.file-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  min-height: 60px; // 确保有足够高度显示遮罩
}

.file-thumbnail {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
    font-size: 20px;
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
  border-radius: 6px;

  .video-play-btn {
    width: 28px;
    height: 28px;
    background: rgba(64, 158, 255, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    transition: all 0.2s ease;

    i {
      font-size: 16px;
      color: white;
      margin-left: 2px;
    }
  }

  &:hover .video-play-btn {
    background: rgba(64, 158, 255, 1);
    transform: scale(1.1);
  }

  .video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    cursor: pointer;
    z-index: 2;
  }
}

.file-icon {
  font-size: 32px;
  color: #409eff;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ::v-deep .el-input {
    width: 120px;
  }
}

.file-size {
  font-size: 12px;
  color: #909399;
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

    .file-item-content:hover .file-actions-mask {
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
    }
  }
}

// 遮罩层样式
.file-actions-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
  padding: 0 12px;
}

// 鼠标悬停时显示遮罩
.file-item-content:hover .file-actions-mask {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.file-actions-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 200px;

  ::v-deep .el-button {
    padding: 8px;
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
