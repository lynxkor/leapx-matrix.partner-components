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
    };
  },
  mounted () {
    const pageSource = this.$store.state.pageSource?.aisPageSource || [];
    const permissionSet = new Set();
    pageSource.forEach(item => {
      permissionSet.add(item);
    });
    const key = this.moduleKey;
    this.canList = permissionSet.has(`${key}-list`);
    this.canPage = permissionSet.has(`${key}-page`);
    this.canDetail = permissionSet.has(`${key}-detail`);
    this.canAddOrUpdate = permissionSet.has(`${key}-addOrUpdate`);
    this.canDelete = permissionSet.has(`${key}-delete`);
    this.canEnableOrDisable = permissionSet.has(`${key}-enableOrDisable`);
    this.canImport = permissionSet.has(`${key}-import`);
    this.canExport = permissionSet.has(`${key}-export`);
    this.canLog = permissionSet.has(`${key}-auditLog`);
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
