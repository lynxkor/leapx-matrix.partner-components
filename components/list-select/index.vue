<!--

查询组件使用:
<el-form-item label="车系名称">
        <list-select
          listUrl="/datacenter/web/materials/vehicleSeries/list"
          placeholder="请选择"
          v-model="form.seriesIds"
          query-key="seriesNameLike"
          clearable
          collapseTags
          auto-load-options
          no-param-load
          multiple
          filterable
          :params="{}" />
      </el-form-item>
      <el-form-item label="车型名称"  v-show="this.visibleCount === 3 || show">
        <list-select
          listUrl="/datacenter/web/materials/vehicleModel/list"
          placeholder="请选择"
          v-model="form.modelIds"
          query-key="modelNameLike"
          clearable
          auto-load-options
          collapseTags
          multiple
          filterable
          :params="{seriesIdList: form.seriesIds}" />
      </el-form-item>
       <el-form-item label="车辆年款">
          <list-select
            listUrl="/datacenter/web/materials/vehicleModelYearTypeRelation/list"
            placeholder="请选择"
            v-model="form.yearTypeIds"
            clearable
            multiple
            collapseTags
            auto-load-options
            filterable
            label-key="yearTypeName"
            value-key="yearTypeId"
            :params="{modelIdList: form.modelIds}" />
        </el-form-item>

编辑页面回写使用, 必须加v-if,必须加v-if,必须加v-if
<el-form-item label="车系" prop="seriesId">
  <list-select
    v-if="form.id"
    listUrl="/datacenter/web/materials/vehicleSeries/list"
    placeholder="请选择"
    v-model="form.seriesId"
    query-key="seriesNameLike"
    auto-load-options
    no-param-load
    filterable
    :params="{}" />
  </el-form-item>
<el-form-item label="车型" prop="modelId">
  <list-select
    v-if="form.id"
    listUrl="/datacenter/web/materials/vehicleModel/list"
    placeholder="请选择"
    v-model="form.modelId"
    query-key="modelNameLike"
    auto-load-options
    collapseTags
    filterable
    :params="{seriesIdList: form.seriesId?[form.seriesId]:[]}" />
</el-form-item>

-->
<template>
<!--  <fetch-select-->
<!--    ref="select"-->
<!--    :remote="true"-->
<!--    :remoteMethod="remoteMethod"-->
<!--    :options="options"-->
<!--    placeholder="请选择"-->
<!--    v-bind="$attrs"-->
<!--    v-model="ids"-->
<!--    @change="handleChange"-->
<!--    valueKey="id"-->
<!--    labelKey="name"-->
<!--    @focus="handleFocus"-->
<!--  >-->
<!--  </fetch-select>-->

  <el-select
    ref="select"
    :remote="true"
    :remoteMethod="remoteMethod"
    :placeholder="placeholder"
    v-bind="$attrs"
    v-model="ids"
    @change="handleChange"
    valueKey="id"
    labelKey="name"
    :multiple="multiple"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.7)"
    @focus="handleFocus"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="item.name"
      :style="showCode && item.code? 'height: 50px' : ''"
      :value="item.id" >
      <div v-if="showCode && item.code">
        <div class="line_1">{{ item.name }}</div>
        <div class="line_2">{{ item.code }}</div>
      </div>
    </el-option>
  </el-select>
</template>
<script>
import xeUtils from 'xe-utils';
import api from '@/axios';
/**
 * 判断值是否存在且不为空
 */
function hasValue (value) {
  // 处理 null 或 undefined
  if (value === null || value === undefined) {
    return false;
  }
  // 处理数组
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // 处理字符串
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  // 处理数字
  if (typeof value === 'number') {
    return true;
  }
  // 处理对象（包括空的 Observer 对象）
  if (typeof value === 'object') {
    // 检查是否是普通的空对象
    return Object.keys(value).length > 0;
  }
  return true;
}
function hasParam (params) {
  if (!params) {
    return false;
  }
  let keys = Object.keys(params);
  for (let key of keys) {
    if (params[key] instanceof Array) {
      if (params[key].length > 0) {
        for (const p of params[key]) {
          if (hasValue(p)) {
            return true;
          }
        }
      }
    } else {
      if (hasValue(params[key])) {
        return true;
      }
    }
  }
  return false;
}

export default {
  name: 'ListSelect',
  components: {
    // FetchSelect
  },
  props: {
    value: {
      type: [Array, String],
      default: () => null
    },
    listUrl: {
      type: String,
      default: ''
    },
    params: {
      type: Object,
      default: () => {}
    },
    queryKey: {
      type: String,
      default: 'name'
    },
    valueKey: {
      type: String,
      default: 'id'
    },
    labelKey: {
      type: String,
      default: 'name'
    },
    limitSize: {
      type: Number,
      default: 20
    },
    /**
     * 是否自动加载数据(默认需要输入关键字)
     */
    autoLoadOptions: {
      type: Boolean,
      default: false
    },
    /**
     * 无参数是否加载
     */
    noParamLoad: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    secondLineKey: {
      type: String,
      default: 'code'
    },
    showCode: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: '请选择'
    }
  },
  data () {
    return {
      ids: [],
      options: [],
      dataList: []
    };
  },
  watch: {
    params: {
      // 监听是否变化
      deep: true,
      handler (val, oldVal) {
        if (!xeUtils.isEqual(val, oldVal)) {
          this.ids = null;
          this.options = [];
          this.$emit('input', null);
          if (this.autoLoadOptions) {
            if (this.noParamLoad) {
              this.remoteMethod();
            } else {
              // 判断是否有参
              if (hasParam(val)) {
                this.remoteMethod();
              }
            }
          }
        }
      }
    },
    value: {
      // 监听是否变化
      deep: true,
      handler (val, oldVal) {
        this.ids = val;
        if (val && !oldVal) {
          console.log('有新值,旧值为空' + val + '旧' + oldVal + Boolean(oldVal));
          if (this.options.length === 0) {
            this.remoteMethod();
          } else {
            // 如果 options已经有了,判断 options带不带这一顶
            let ele = this.options.find(item => item[this.valueKey] === val);
            if (!ele) {
              this.remoteMethod();
            }
          }
        }
      }
    }
  },
  mounted () {
    if (hasValue(this.value)) {
      // mounted时带值,是回写, 理论上也一定有参数
      this.ids = this.value;
      this.remoteMethod();
    } else if (this.noParamLoad) {
      this.remoteMethod();
    }
  },
  methods: {
    remoteMethod (query) {
      console.log('remoteMethod', query);
      this.options = [];
      this.dataList = [];
      let data = { ...this.params };
      if (query) {
        data[this.queryKey] = query;
      } else if (hasValue(this.ids)) {
        if (this.multiple) {
          data.ids = this.ids;
        } else {
          data.id = this.ids;
        }
      }

      data.limitSize = this.limitSize;
      api.jsonPost(this.listUrl, data).then(dataList => {
        if (dataList.length !== 0) {
          this.options = [];
          this.dataList = [...dataList];
          for (let ele of dataList) {
            let item = { id: ele[this.valueKey], name: ele[this.labelKey] };
            item.code = ele[this.secondLineKey];
            this.options.push(item);
          }
        }
        this.$forceUpdate();
      });
    },
    handleChange (val) {
      if (!this.multiple) {
        let selectedItemList = this.dataList.filter(item => item[this.valueKey] === val);
        let selectedItem = selectedItemList[0];
        this.$emit('change', val, selectedItem);
      }
      this.$emit('input', val);
      if (!hasValue(val)) {
        // 清除时，重新拉
        if (this.noParamLoad) {
          this.remoteMethod();
        } else {
          // 判断是否有参
          if (hasParam(this.params)) {
            this.remoteMethod();
          }
        }
      }
    },
    handleFocus (e) {
      if (this.options.length === 0 && this.autoLoadOptions) {
        this.remoteMethod();
      }
      this.$emit('focus', e.target.value);
    },

  }
};
</script>

<style scoped lang="scss">
.line_1 {
  color: #333333;
  font-size: 14px;
  height: 20px;
}
.line_2 {
  color: #999999;
  height: 20px;
}
</style>
