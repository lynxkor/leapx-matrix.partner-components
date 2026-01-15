import navigate from '../utils/navigate';
// 公共逻辑预埋
// 后续遇到所有页面改动时，优先考虑添加到该文件
// 页面都注入pageType = 'detail' || 'edit' || 'list'，根据页面类型选择性注入方法
export default {
  data () {
    const isEditing = this.$route.query.isEditing === 'true';
    return {
      isEditing,
      breadcrumbTitle: isEditing ? '编辑' : '详情',
      isFirstActivated: true,
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick (picker) {
            const end = new Date();
            end.setHours(23, 59, 59, 999); // 设置为当天的 23:59:59
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            start.setHours(0, 0, 0, 0); // 设置为前七天的 00:00:00
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一个月',
          onClick (picker) {
            const end = new Date();
            end.setHours(23, 59, 59, 999); // 设置为当天的 23:59:59
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            start.setHours(0, 0, 0, 0); // 设置为前30天的 00:00:00
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近三个月',
          onClick (picker) {
            const end = new Date();
            end.setHours(23, 59, 59, 999); // 设置为当天的 23:59:59
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            start.setHours(0, 0, 0, 0); // 设置为前90天的 00:00:00
            picker.$emit('pick', [start, end]);
          }
        }]
      },
      formRefs: [], // 存储表单引用
    };
  },
  watch: {
    isEditing: {
      handler (newVal) {
        this.$nextTick(() => {
          this.updateFormRefs();
        });
      }
    }
  },
  activated () {
    // 首次激活时，不执行
    if (this.isFirstActivated) {
      this.isFirstActivated = false;
      return;
    }
    // keep-alive 缓存过的页面，激活时重新设置面包屑
    if (this.$route.meta.keepAlive && this.pageTitle) {
      this.$store.commit('SET_ACTIVE_BREADCRUMB', [this.pageTitle]);
      this.getData?.();
    }
  },
  created () {
    this.initBreadcrumb();
  },
  mounted () {
    // 统一给高级编辑页标题注入展开缩起逻辑
    if (this.pageType === 'edit') {
      const el = document.querySelectorAll('.common-section-header h2');
      for (let i = 0; i < el.length; i++) {
        el[i].addEventListener('click', this.addHeaderActions);
      }
    }
    this.updateFormRefs();
  },
  beforeDestroy () {
    if (this.pageType === 'edit') {
      const el = document.querySelectorAll('.common-section-header h2');
      for (let i = 0; i < el.length; i++) {
        el[i].removeEventListener('click', this.addHeaderActions);
      }
    }
  },
  provide () {
    if (this.pageType === 'edit') {
      return {
        formRefs: this.formRefs,
        moduleKey: this.moduleKey || '',
      };
    }
    return {
      moduleKey: this.moduleKey || '',
    };
  },
  methods: {
    updateFormRefs () {
      if (this.pageType === 'edit') {
        Object.keys(this.$refs).forEach((key) => {
          if (key.startsWith('ruleForm') && !this.formRefs.includes(this.$refs[key])) {
            this.formRefs.push(this.$refs[key]);
          }
        });
      }
    },
    /**
     * 页面包屑导航
     */
    initBreadcrumb () {
      const inEditPage = location.pathname.endsWith('/edit');
      if (this.pageType === 'list') {
        this.$store.commit('SET_ACTIVE_BREADCRUMB', [this.pageTitle]);
      } else if (this.pageType === 'edit' && inEditPage) {
        const id = this.$route.query.id;
        this.$store.commit('SET_ACTIVE_BREADCRUMB', [this.pageTitle, `${id ? this.breadcrumbTitle : '新建'}`]);
      }
    },
    addHeaderActions (e) {
      const parent = e.target.parentNode;
      const el = parent.nextSibling;
      if (parent.className.includes('fold')) {
        parent.classList.remove('fold');
        el.style.display = 'block';
      } else {
        parent.classList.add('fold');
        el.style.display = 'none';
      }
    },
    /**
     * 统一路由跳转，支持子应用之间跳转
     * @param {Object|String} location 同 $router.push 参数
     * @param {Boolean} isBlank 是否需要强制新开窗口
     *
     * @example 跳转到门店详情
        this.navigateToRoute({
          path: '/partner/channelManagement/shopDetail',
          query: {
            dealerCode: row.dealerCode,
          },
        });
     */
    navigateToRoute (location, isBlank) {
      navigate(location, isBlank, this.$router);
    },
  },
};
