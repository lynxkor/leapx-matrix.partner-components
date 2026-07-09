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
              :src="getDisplayUrl(file)"
              :alt="file.name"
              fit="contain"
              lazy
              :preview-src-list="imagePreviewList"
              :initial-index="getImageIndex(file)"
              style="width: 100%; height: 100%; cursor: pointer;"
            >
              <div slot="placeholder" class="image-slot">
                <i class="el-icon-loading"></i>
              </div>
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
      // HEIC 转换后的可预览 URL 缓存：key = file.id || file.url，value = 转换后的 blob URL
      heicDisplayUrlCache: {},
    };
  },

  computed: {
    // 获取所有图片的预览列表（HEIC 用转换后的 URL，未转换完成的不进入列表，避免空 URL）
    imagePreviewList () {
      const urls = [];
      this.fileList.forEach(file => {
        if (file.isImage && file.url) {
          const displayUrl = this.getDisplayUrl(file);
          if (displayUrl) urls.push(displayUrl);
        }
      });
      return urls;
    }
  },
  watch: {
    fileList: {
      handler () {
        this.convertHeicImages();
      },
      immediate: true,
    },
  },

  beforeDestroy () {
    // 释放 HEIC 转码产生的 blob URL，避免内存泄漏
    Object.values(this.heicDisplayUrlCache).forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
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

      const imageUrl = this.getDisplayUrl(file);
      if (!imageUrl) return 0;

      return this.imagePreviewList.findIndex(url => url === imageUrl);
    },

    // 是否为 HEIC/HEIF（浏览器原生无法解码，需运行时转码）
    isHeic (file) {
      if (!file) return false;
      const type = (file.fileType || '').toLowerCase().replace(/^\./, '');
      const name = (file.name || '').toLowerCase();
      return type === 'heic' || type === 'heif' || name.endsWith('.heic') || name.endsWith('.heif');
    },

    // 取图片展示 URL：HEIC 优先用转换后的 URL，未转换前回退占位避免提前触发碎图
    getDisplayUrl (file) {
      if (!file) return '';
      if (this.isHeic(file)) {
        const cacheKey = file.id || file.url;
        const cached = this.heicDisplayUrlCache[cacheKey];
        // 未转换完成时返回一个空白占位，避免 el-image 直接加载原始 HEIC 显示碎图
        return cached || '';
      }
      return file.url;
    },

    // 遍历列表，对 HEIC 项异步转码并缓存
    convertHeicImages () {
      (this.fileList || []).forEach(file => {
        if (file.isImage && this.isHeic(file)) {
          this.convertHeic(file);
        }
      });
    },

    // 将单个 HEIC 文件转码为 JPEG blob URL 并缓存
    async convertHeic (file) {
      const cacheKey = file.id || file.url;
      if (!cacheKey || this.heicDisplayUrlCache[cacheKey]) return;
      try {
        const response = await fetch(file.url);
        const rawBlob = await response.blob();
        // 部分文件服务对 HEIC 文件实际存的是 JPEG 内容，返回 image/jpeg 等类型。
        // 此时浏览器本身就能解码，直接用原 URL 即可，无需 heic2any，避免 "already browser readable" 报错。
        const browserReadableTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
        if (browserReadableTypes.includes(rawBlob.type)) {
          this.$set(this.heicDisplayUrlCache, cacheKey, file.url);
          return;
        }
        // 动态 import，避免 WASM 打进主 bundle、影响非 HEIC 用户首屏
        const heic2any = (await import('heic2any')).default;
        const converted = await heic2any({ blob: rawBlob, toType: 'image/jpeg', quality: 0.9 });
        const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
        const displayUrl = URL.createObjectURL(convertedBlob);
        // $set 触发响应式更新，让 el-image / imagePreviewList 重新取值
        this.$set(this.heicDisplayUrlCache, cacheKey, displayUrl);
      } catch (error) {
        // heic2any 检测到文件实际内容已是 JPEG 等浏览器可解码格式（code=1）时，
        // 直接用 file.url 渲染即可，属正常分支无需报错；其他错误才打印。
        if (error?.code !== 1) {
          console.error('HEIC 转码失败:', error);
        }
        this.$set(this.heicDisplayUrlCache, cacheKey, file.url);
      }
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
      const url = file?.url || file?.response?.fileUrl;
      // fileName 可能为 null，从 URL 末段提取兜底
      const name = file?.name ||
        file?.response?.fileName ||
        (url ? url.split('/').pop()?.split('?')[0] : '') ||
        (file.fileType ? `未命名文件.${file.fileType.toLowerCase()}` : '未命名文件');
      // 缺少下载地址或文件名时直接拦截，避免下载出名为 null 的空文件
      if (!url) {
        this.$message?.error('文件下载地址缺失，无法下载');
        return;
      }

      // 本地文件直接下载
      if (file.raw) {
        const objectUrl = URL.createObjectURL(file.raw);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = name || file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
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
