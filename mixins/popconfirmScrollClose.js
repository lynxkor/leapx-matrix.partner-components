/**
 * Mixin: popconfirmScrollClose
 * 滚动时自动关闭 el-popconfirm 弹框，解决popconfirm不随页面滚动问题
 *
 * 原理：用 capture:true 在 window 上监听所有滚动事件，
 * 触发 Element UI 的 click-outside 机制来关闭弹层
 * 需要的页面自行引入即可
 */
export default {
  mounted () {
    this._popconfirmScrollHandler = () => {
      document.dispatchEvent(new MouseEvent('click'));
    };
    window.addEventListener('scroll', this._popconfirmScrollHandler, true);
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this._popconfirmScrollHandler, true);
  }
};
