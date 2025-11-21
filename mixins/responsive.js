// mixins/responsiveSearchForm.js
export default {
  data () {
    return {
      visibleCount: 2,
      screenWidth: 0
    };
  },

  computed: {
    /**
       * 根据屏幕宽度计算可见的表单项数量
       */
    computedVisibleCount () {
      if (this.screenWidth >= 1920) {
        return 3; // 大屏幕：3个固定项 + 可折叠项
      } else if (this.screenWidth >= 1139) {
        return 2; // 笔记本屏幕：2个固定项 + 可折叠项
      } else {
        return 1; // 小屏幕：1个固定项 + 可折叠项
      }
    }
  },

  mounted () {
    this.updateScreenWidth();
    window.addEventListener('resize', this.updateScreenWidth);
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.updateScreenWidth);
  },

  methods: {
    /**
       * 更新屏幕宽度
       */
    updateScreenWidth () {
      this.screenWidth = window.innerWidth;
      this.visibleCount = this.computedVisibleCount;
    }
  }
};
