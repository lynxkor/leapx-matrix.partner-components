<template>
  <div id="printArea" style="width:100%; text-align:center">
    <div class="head-content">
      <div class="head-image" style="padding: 5px;">
        <img
          src="data:image/png;base64,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"
          alt="leapmotor.com">
      </div>
      <div class="head-company" style="padding: 5px;">
        <span id="company-name">{{data.dealerName}}</span>
      </div>
      <div class="head-info" style="padding: 5px;">
        <span id="printtime">{{data.warrantyMonth}}</span>旧件回运单
      </div>
    </div>
    <table class="gridtable">
      <thead>
        <tr>
          <th style="width: 200px;padding: 0px;">回运单号</th>
          <th>回运日期</th>
          <th>回运类型</th>
          <th>回运地址</th>
          <th>物流单号</th>
          <th>物流商</th>
          <th>预计到达日期</th>
          <th>发货人</th>
          <th>发货联系电话</th>
          <th>收货人/电话</th>
        </tr>
      </thead>
      <tbody id="data-main">
        <tr>
          <td>{{ form.returnOrderNo }}</td>
          <td>{{ transformDate(form.returnDate) }}</td>
          <td>{{ form.returnTypeLabel}}</td>
          <td>{{ form.receiverAddress }}</td>
          <td>{{ form.logisticsTrackingNo }}</td>
          <td>{{ form.logisticsCompany}}</td>
          <td>{{ transformDate(form.estimatedArrivalDate) }}</td>
          <td>-----</td>
          <td>-----</td>
          <td>{{ form.receiverContact }};{{ form.receiverPhone }}</td>
        </tr>
      </tbody>
    </table>
    <div class="content-info">本次回运单明细如下：</div>
    <table class="gridtable">
      <thead>
        <tr>
          <th style="width:30px">序号</th>
          <th style="width:160px">旧件唯一码</th>
          <th style="width:140px">Vin码</th>
          <th style="width:100px">旧件编码</th>
          <th style="width:140px">旧件名称</th>
          <th style="width:60px">供应商代码</th>
          <th style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">供应商名称</th>
          <th style="width:30px;">数量</th>
          <th style="width:60px;">是否主因件</th>
          <th>门店备注</th>
          <th style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">验收记录</th>
        </tr>
      </thead>
      <tbody id="data-list">
        <tr>
          <td>1</td>
          <td>53L01SC410W25050034-1</td>
          <td>LFZ93AN99RD103393</td>
          <td>3.0.01.10.00228</td>
          <td>中控显示屏</td>
          <td>63330801-1</td>
          <td style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">零跑汽车-汽车电子</td>
          <td>1</td>
          <td>是</td>
          <td>--</td>
          <td>--</td>
        </tr>
        <tr>
          <td colspan="2">门店确认：</td>
          <td colspan="3"></td>
          <td>零跑验收：</td>
          <td></td>
          <td colspan="2">验收日期：</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>

  </div>
</template>
<script>
export default {
  components: {
  },
  props: {
    id: {
      type: String,
      default: ''
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
    };
  },
  computed: {
    form: {
      get () {
        return this.data.form;
      },
    },
    tableData: {
      get () {
        return this.data.tableData;
      },
    }
  },
  mounted () {
    console.log(this.data);
  },
  methods: {
    transformDate (time) {
      if (!time) {
        return '';
      }
      const date = new Date(time);
      var Y = date.getFullYear();
      const _m = date.getMonth() + 1;
      var M = (_m < 10 ? '0' + (_m) : _m);
      const _d = date.getDate();
      var D = _d < 10 ? '0' + _d : _d;
      return `${Y}/${M}/${D}`;
    }
  },
};
</script>
<style lang="scss" scoped>
.head-content {
  padding: 5px;
  font-weight: 800;
  border: 1px solid #666666;
  border-bottom: none;
}

.head-image {
  float: left;
  width: 20px;
}

table {
  font-family: verdana, arial, sans-serif;
  font-size: 12px;
  color: #333333;
  border-width: 1px;
  border-color: #666666;
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}

.content-info {
  padding: 5px;
  text-align: left;
  border: 1px solid #666666;
  font-weight: 800;
  border-top: none;
  border-bottom: none;
}

table th,
table td {
  border-width: 1px;
  border-style: solid;
  border-color: #666666;
  text-align: center;
  width: 80px;
  height: 30px;
}

table th {
  background-color: #dedede !important;
}

table td {
  background-color: #ffffff;
  word-wrap: break-word;
  word-break: break-all;
}
</style>
