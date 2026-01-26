<template>
  <el-dialog
    width="1000px"
    :title="title"
    :visible.sync="dialogVisible"
    :before-close="handleClose"
    append-to-body>
    <video
      ref="videoPlayer"
      class="ais-video"
      width="100%"
      height="100%"
      controls="controls"
      autoplay="autoplay">
      <source :src="url" type="video/mp4" />
    </video>
  </el-dialog>
</template>

<script>

export default {
  data () {
    return {
      dialogVisible: false,
      title: '视频播放',
      url: '',
    };
  },
  watch: {
    // 监听url变化，重新加载视频
    url (newUrl, oldUrl) {
      if (newUrl && newUrl !== oldUrl) {
        this.$nextTick(() => {
          this.loadVideo();
        });
      }
    },
    // 监听对话框显示状态，隐藏时暂停视频
    dialogVisible (visible) {
      if (!visible && this.$refs.videoPlayer) {
        this.$refs.videoPlayer.pause();
      }
    }
  },
  mounted () {
  },
  methods: {
    show (options = {}) {
      // 先关闭对话框重置状态
      if (this.dialogVisible) {
        this.dialogVisible = false;
        this.$nextTick(() => {
          this.setOptionsAndShow(options);
        });
      } else {
        this.setOptionsAndShow(options);
      }
    },
    setOptionsAndShow (options) {
      this.url = options.url || '';
      this.title = options.title || '视频播放';
      this.dialogVisible = true;

      // 等待DOM更新后加载视频
      this.$nextTick(() => {
        this.loadVideo();
      });
    },
    // 加载视频
    loadVideo () {
      if (this.$refs.videoPlayer && this.url) {
        const video = this.$refs.videoPlayer;

        // 重置视频
        video.pause();
        video.currentTime = 0;

        // 重新加载视频源
        video.load();

        // 尝试自动播放（浏览器策略可能限制）
        video.play().catch(error => {
          console.log('自动播放被阻止:', error);
          // 可以在这里添加用户交互后播放的逻辑
        });
      }
    },

    handleClose () {
      // 先暂停视频
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.pause();
        this.$refs.videoPlayer.currentTime = 0;
      }

      this.dialogVisible = false;
      this.url = '';
      this.title = '视频播放';
    }

  }
};
</script>
<style scoped lang="scss">
  .ais-video {
    max-height: 75vh;
  }
  ::v-deep .el-dialog .el-dialog__header{
    line-height: 24px;
  }
  ::v-deep .el-dialog .el-dialog__body {
    padding-bottom: 0px;
  }
</style>
