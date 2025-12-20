// mixins/permissions.js
// 通用权限配置
export default {
  data () {
    return {
      canList: true,
      canPage: true,
      canDetail: true,
      canAddOrUpdate: true,
      canDelete: true,
      canEnableOrDisable: true,
      canImport: true,
      canExport: true,
      canLog: true,
      permissions: new Set(),
    };
  },
  created () {
    const pageSource = (this.$store.state.pageSource?.aisPageSource || []).filter(item => item.startsWith(this.moduleKey));
    pageSource.forEach(item => {
      this.permissions.add(item);
    });
    const key = this.moduleKey;
    this.canList = this.permissions.has(`${key}-list`);
    this.canPage = this.permissions.has(`${key}-page`);
    this.canDetail = this.permissions.has(`${key}-detail`);
    this.canAddOrUpdate = this.permissions.has(`${key}-addOrUpdate`);
    this.canDelete = this.permissions.has(`${key}-delete`);
    this.canEnableOrDisable = this.permissions.has(`${key}-enableOrDisable`);
    this.canImport = this.permissions.has(`${key}-import`);
    this.canExport = this.permissions.has(`${key}-export`);
    this.canLog = this.permissions.has(`${key}-auditLog`);
    this.fixTableConfig();
  },
  methods: {
    fixTableConfig () {
      if (this.optionObj?.dataProp) {
        const operate = this.optionObj.dataProp.find(item => item.props === 'operate');
        // 没有编辑权限
        if (!this.canAddOrUpdate) {
          operate.buttons = operate.buttons.filter(item => item.name !== '编辑');
        }
        // 没有删除权限
        if (!this.canDelete) {
          operate.buttons = operate.buttons.filter(item => item.name !== '删除');
        }
        // 没有查看审计日志权限
        if (!this.canDelete) {
          operate.buttons = operate.buttons.filter(item => item.name !== '日志');
        }
        // 如果没有操作列，全部删除
        if (operate.buttons.length === 0) {
          this.optionObj.dataProp = this.optionObj.dataProp.filter(item => item.props !== 'operate');
        }
        // 没有查看详情权限
        if (!this.canDetail) {
          delete this.optionObj.dataProp[0].buttons;
        }
      }
    }
  }
};
