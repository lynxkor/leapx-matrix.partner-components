<!--
  调用方式：
  this.$print.show({
    id: 'xxxx', // 必选，对应数据id
    template: 'demo', // 必选，对应 @/components/PrintTemplate/文件名.vue
    title: 'test'，// 可选，打印标题
    data: { id: 'xxx', ...} // 可选，其他数据对象
  });
  ---------
  开发步骤：
  1. 开发打印模版，拷贝demo.vue文件于@/components/PrintTemplate/目录
  2. 从老销服系统拷贝对应html模版到新文件
  3. 开发模版文件，完成数据调用和渲染
  4. 即可使用
-->
<template>
   <el-dialog :title="printObj.popTitle" :width="width + 'px'" :visible.sync="dialogVisible" :append-to-body="true" :show-close="false" custom-class="dialog-print" :destroy-on-close="true">
      <div class="print-content">
        <!-- 动态组件 -->
        <component :is="currentComponent" :id="id" :data="data" v-bind="rest" />
      </div>
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="close">取消</el-button>
      <el-button size="small" type="primary" v-print="printObj">打印</el-button>
    </div>
   </el-dialog>
</template>

<script>
import print from 'vue-print-nb';

export default {
  name: 'PrintDialog',
  directives: {
    print
  },
  data () {
    return {
      width: 1080,
      dialogVisible: false,
      id: '',
      data: {},
      currentComponent: null, // 动态组件
      printObj: {
        id: 'printArea',
        popTitle: '',
        beforeOpenCallback (vue) {
          console.log('打开之前');
        },
        openCallback (vue) {
          console.log('执行了打印');
        },
        closeCallback (vue) {
          console.log('关闭了打印工具');
        }
      },
      rest: {}, // 其他参数
    };
  },

  watch: {
    dialogVisible (newVal, oldVal) {
      // 当窗口关闭时，清理路由监听
      if (oldVal === true && newVal === false) {
        this.removeRouteListeners();
      }
    }
  },

  methods: {
    handleRouteChange () {
      if (this.dialogVisible) {
        this.close();
      }
    },

    addRouteListeners () {
      if (this.hasRouteListeners) return;

      // 绑定 this
      this.boundHandleRouteChange = this.handleRouteChange.bind(this);
      // history 模式主要监听 popstate 事件
      window.addEventListener('popstate', this.boundHandleRouteChange);
      // 也监听 hashchange 作为补充（某些情况下可能触发）
      window.addEventListener('hashchange', this.boundHandleRouteChange);

      this.hasRouteListeners = true;
    },

    removeRouteListeners () {
      if (!this.hasRouteListeners) return;

      window.removeEventListener('popstate', this.boundHandleRouteChange);
      window.removeEventListener('hashchange', this.boundHandleRouteChange);

      this.boundHandleRouteChange = null;
      this.hasRouteListeners = false;
    },

    async show (options = {}) {
      const { title = '', template, id, data, width, ...rest } = options;
      this.printObj.popTitle = title;
      this.id = id;
      this.data = data;
      this.rest = { ...rest }; // 确保是对象格式
      if (width) {
        this.width = width;
      }
      // 动态加载组件
      try {
        const component = await this.loadComponent(template);
        if (component) {
          this.currentComponent = component;
          this.dialogVisible = true;
          // 窗口打开后添加路由监听
          this.addRouteListeners();
        }
      } catch (error) {
        console.error(`加载模板 ${template} 失败:`, error);
        // 可以设置一个默认组件或错误提示
      }
    },

    async loadComponent (templateName) {
      // 根据模板名称动态导入组件
      try {
        // 使用 import() 动态导入组件
        const component = await import(`@/components/PrintTemplate/${templateName}.vue`);
        return component.default;
      } catch (error) {
        this.$message.error(`打印模板 ${templateName} 不存在，请联系管理员`);
        this.close();
        return null;
      }
    },

    close () {
      this.dialogVisible = false;
      this.id = '';
      this.data = {}; // 清空数据
      this.removeRouteListeners();
      this.$nextTick(() => {
        this.currentComponent = null;
      });
    },
  },
};
</script>
<style lang="scss">
// 打印样式优化
@media print {
  body {
    zoom: 100%; /* 或者使用 transform: scale(1); */
  }
}
.dialog-print.el-dialog {
  height: calc(100% - 160px);
  margin-top: 80px !important;
  .el-dialog__header {
    display: none;
  }
  .el-dialog__body {
    height: 100%;
    max-height: calc(100% - 60px);
  }
}
#printArea {
  .PageNext {
    page-break-after: always;
  }
  table.gridtable {
    font-size: 14px;
    color: #000;
    border-width: 1px;
    border-color: #666666;
    border-collapse: collapse;
    width: 100%;
  }
  pre {
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
    white-space: normal;
  }

  table.gridtable th {
    border-width: 1px;
    padding: 10px;
    border-style: solid;
    border-color: #666666;
    background-color: #b4d8ef;
    text-align: center;
  }

  table.gridtable td {
    border-width: 1px;
    padding: 8px;
    border-style: solid;
    border-color: #666666;
    background-color: #ffffff;
    text-align: center;
  }

  .subTitle {
    text-align: center;
  }

  .pageTitle {
    width: 100%;
    border-style: solid;
    border-color: #666666;
    border-width: 1px;
    padding: 10px;
    border-bottom-width: 0px;
    font-size: 14px;
    color: #000;
  }

  .detail {
    border-width: 1px;
    border-style: solid;
    border-color: #666666;
    padding: 5px;
    border-top-width: 0px;
    border-left-width: 0px;
  }

  .detail_two {
    border-width: 1px;
    border-style: solid;
    border-color: #666666;
    padding: 5px;
    border-top-width: 0px;
    border-left-width: 0px;
  }

  table.gridtable120 {
    font-size: 14px;
    color: #000;
    border-width: 1px;
    border-color: #666666;
    border-collapse: collapse;
    width: 100%;
  }

  table.gridtable120 td {
    border-width: 1px;
    padding: 5px;
    border-style: solid;
    border-color: #666666;
    background-color: #ffffff;
    text-align: center;
    border-left-width: 0px;
  }

  table.grid120 {
    font-size: 14px;
    border-collapse: collapse;
    width: 100%;
  }

  table.grid120 td {
    border-width: 0px;
    padding: 8px;
    background-color: #ffffff;
    text-align: center;
  }
}
</style>
