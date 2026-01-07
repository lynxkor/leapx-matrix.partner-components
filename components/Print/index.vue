<!--
  调用方式：
  this.$print.show({
    id: 'xxxx', // 必选，对应数据id
    template: 'demo', // 必选，对应 ./template/文件名.vue
    title: 'test'，// 可选，打印标题
    data: { id: 'xxx', ...} // 可选，其他数据对象
  });
  ---------
  开发步骤：
  1. 开发打印模版，拷贝demo.vue文件于./template/目录
  2. 从老销服系统拷贝对应html模版到新文件
  3. 开发模版文件，完成数据调用和渲染
  4. 即可使用
-->
<template>
   <el-dialog title="" :width="width + 'px'" :visible.sync="dialogVisible" :append-to-body="true" :show-close="false" custom-class="dialog-print">
      <div class="print-content">
        <!-- 动态组件 -->
        <component :is="currentComponent" :id="id" :data="data" />
      </div>
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="dialogVisible = false">取消</el-button>
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
      }
    };
  },

  methods: {
    async show (options = {}) {
      const { title = '', template, id, data, width } = options;
      this.printObj.popTitle = title;
      this.id = id;
      this.data = data;
      if (width) {
        this.width = width;
      }
      // 动态加载组件
      try {
        const component = await this.loadComponent(template);
        if (component) {
          this.currentComponent = component;
          this.dialogVisible = true;
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
        const component = await import(`./template/${templateName}.vue`);
        return component.default;
      } catch (error) {
        this.$message.error(`打印模板 ${templateName} 不存在，请联系管理员`);
        this.close();
        return null;
        // console.error(`打印模板 ${templateName} 不存在，尝试加载默认模板`);
        // 如果指定模板不存在，加载默认模板
        // const defaultComponent = await import('./template/demo.vue');
        // return defaultComponent.default;
      }
    },

    close () {
      this.dialogVisible = false;
    },
  },
};
</script>
<style lang="scss">
.dialog-print {
  .el-dialog__header {
    display: none;
  }
}
#printArea {
  .PageNext {
    page-break-after: always;
  }
  table.gridtable {
    font-family: verdana, arial, sans-serif;
    font-size: 11px;
    color: #333333;
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
    font-family: verdana, arial, sans-serif;
    font-size: 11px;
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
    font-family: verdana, arial, sans-serif;
    font-size: 11px;
    color: #333333;
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
    font-family: verdana, arial, sans-serif;
    font-size: 11px;
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
.print-content{
  max-height: 800px;
  overflow: auto;
}
</style>
