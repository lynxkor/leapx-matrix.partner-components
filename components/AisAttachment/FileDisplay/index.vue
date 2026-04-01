<template>
  <div class="file-display-container" :class="{nine: type === 'card'}">
    <transition-group name="file-list" tag="div" class="file-list-wrapper">
      <div
        v-for="(file, index) in fileList"
        :key="file.id || file.uid"
        class="file-item"
        :class="{
          'file-item-image': file.isImage,
          'file-item-video': file.isVideo,
          'file-item-document': !file.isImage && !file.isVideo
        }"
      >
        <div class="card">
          <div class="content">
            <!-- 图片 -->
            <el-image
              v-if="file.isImage"
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
            <!-- 视频 -->
            <div v-else-if="file.isVideo" class="video-thumbnail" @click.stop="handleVideo(file)">
              <div class="video-preview" v-if="file.thumbnailUrl">
                <img :src="file.thumbnailUrl" alt="视频缩略图" class="thumbnail-image">
              </div>
              <div class="video-play-btn">
                <img :src="require('../icon/video.png')" alt="">
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
            <!-- excel -->
            <div class="card-img" v-else-if="file.isExcel">
              <img :src="require('../icon/xls.png')" alt="">
            </div>
            <!-- ppt -->
            <div class="card-img" v-else-if="file.isPPT">
              <img :src="require('../icon/ppt.png')" alt="">
            </div>
            <!-- word -->
            <div class="card-img" v-else-if="file.isWord">
              <img :src="require('../icon/word.png')" alt="">
            </div>
            <!-- pdf -->
            <div class="card-img" v-else-if="file.isPdf" @click.stop="handlePdf(file)">
              <img :src="require('../icon/pdf.png')" alt="">
            </div>
            <!-- zip, rar -->
            <div class="card-img" v-else-if="file.isZip || file.isRar">
              <img :src="require('../icon/zip.png')" alt="">
            </div>
            <!-- 其他文件 -->
            <div v-else class="card-img">
              <img :src="require('../icon/text.png')" alt="">
            </div>
          </div>
          <div class="file-actions-mask">
            <el-popover
              :ref="`popoverRef_${index}`"
              v-if="!readonly && !file.raw"
              class="iconfont"
              placement="right"
              width="400"
              trigger="click">
              <el-form label-width="" class="form-edit">
                <el-form-item>
                  <el-input @keydown.enter.native.prevent.stop v-model="file.copyName"/>
                </el-form-item>
                <el-form-item style="margin:0;text-align: right;">
                  <el-button size="small" @click.stop="onNameClose(index)">取消</el-button>
                  <el-button size="small" type="primary" @click.stop="onNameSave(file, index)">保存</el-button>
                </el-form-item>
              </el-form>
              <i slot="reference" class="iconfont icon-lxppc-edit" @click="onNameEdit(file, index)"></i>
            </el-popover>
            <i class="iconfont icon-lxppc-download" @click.stop="handleDownload(file)"></i>
            <i v-if="!readonly" class="iconfont icon-lxppc-trash" @click.stop="handleDelete(file,index)"></i>
          </div>
        </div>
        <div class="desc">
          <el-popover>
            {{ file.name }}
            <span slot="reference">{{ file.name }}</span>
          </el-popover>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import AisVideo from '../../AisVideo/index.vue';
import { addOrUpdateFile } from '../../../api/attachment/index';

export default {
  name: 'FileDisplay',
  components: {
    AisVideo
  },
  props: {
    // 文件列表
    fileList: {
      type: Array,
      default: () => ([])
    },

    // 是否只读
    readonly: {
      type: Boolean,
      default: false
    },

    // 自定义文件类型检测函数
    fileTypeDetector: {
      type: Function,
      default: null
    },
    type: {
      type: String,
      default: 'default',
      validator: (value) => {
        return ['default', 'card'].includes(value);
      }
    },
  },
  data () {
    return {
      editable: true,
    };
  },

  computed: {
    // 获取所有图片的预览列表
    imagePreviewList () {
      const urls = [];
      this.fileList.forEach(file => {
        if (file.isImage && file.url) {
          urls.push(file.url);
        }
      });
      return urls;
    }
  },

  methods: {
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
      if (!file.isImage) return 0;

      const imageUrl = file.url || file.thumbUrl;
      if (!imageUrl) return 0;

      return this.imagePreviewList.findIndex(url => url === imageUrl);
    },

    // 通过"查看"按钮触发图片预览
    handleViewImage (file, index) {
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
      // 本地文件直接下载
      if (file.raw) {
        const url = URL.createObjectURL(file.raw);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }

      // 远程文件下载
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
      if (this.readonly) {
        return;
      }
      this.$emit('delete', {
        file,
        index
      });
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
    //
    onNameEdit (file, index) {
      // 分离文件名和后缀
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      if (lastDotIndex > 0) {
        // 有后缀名的情况，只复制文件名部分（不含后缀）
        const nameWithoutExt = fileName.substring(0, lastDotIndex);
        this.$set(file, 'copyName', nameWithoutExt);
      } else {
        // 没有后缀名的情况
        this.$set(file, 'copyName', fileName);
      }
    },
    // 更新文件名
    onNameSave (file, index) {
      if (!file.name) {
        this.$message.info('文件名不能为空');
        return;
      }
      addOrUpdateFile({
        id: file.id,
        fileName: file.copyName + '.' + file.fileType,
        fileUrl: file?.response?.fileUrl,
      }).then(res => {
        this.$emit('update');
        this.onNameClose(index);
      });
      //
    },
    onNameClose (index) {
      const ref = this.$refs[`popoverRef_${index}`]?.[0];
      ref.doClose();
    },
    handlePdf (file) {
      if (file.url) {
        window.open(file.url);
      }
    },
    onEnter () {}
  }
};
</script>

<style lang="scss" scoped>
.file-display-container {
  width: 100%;
  &.nine{
    .file-item{
      &:nth-child(3n+3) {
        margin-right: 0;
      }
    }
  }
}

.file-list-wrapper {
  display: flex;
  flex-wrap: wrap;
}

.file-item {
  width: 100px;
  margin-right: 12px;
  margin-bottom: 12px;
  cursor: pointer;

  .card {
    height: 100px;
    width: 100%;
    background: #FCFBFB;
    border: 1px solid #E6E6E5;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    .content{
      width: 100%;
      height: 100%;
      // 图片
      ::v-deep .el-image{
        border-radius: 4px;
      }
      // 视频
      .video-thumbnail{
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        .video-preview{
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0px;
          .thumbnail-image{
            border-radius: 4px;
            width: 100%;
            height: 100%;
          }
        }
        .video-play-btn{
          width: 28px;
          height: 28px;
          position: relative;
          z-index: 1;
          img{
            width: 100%;
            height: 100%;
          }
        }
      }
      .card-img{
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        img{
          width: 40px;
          height: 40px;
        }
      }
      // 文件
      .other {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 40px;
        color: #409eff;
      }
    }
    .file-actions-mask{
      position: absolute;
      z-index: 2;
      width: 100%;
      height: 28px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 0 0 4px 4px;
      display: flex;
      align-items: center;
      overflow: hidden;
      //
      transition: all 0.2s ease-in-out;
      bottom: -28px; /* 初始位置在容器外部 */
      .iconfont{
        width: 33.3%;
        color: #fff;
        text-align: center;
      }
    }
    /* 父元素悬停时的效果 */
    &:hover .file-actions-mask {
      bottom: 0; /* 滑入到可视区域 */
    }
  }
  .desc{
    font-size: 12px;
    color: #3B3E3B;
    line-height: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    margin-top: 4px;
  }
}
.el-button{
  font-weight: normal;
}

</style>
