<template>
  <div id="printArea" style="width:1060px;">
    <div v-for="item in data" :key="item.id" class="divMain">
      <div class="divLeft">
        <table>
          <tbody>
            <tr>
              <td colspan="2">
                <img
                  src="data:image/png;base64,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">
              </td>
              <td colspan="2" class="tdtitle">保修旧件标签</td>
            </tr>
            <tr>
              <td>服务中心代码：</td>
              <td>{{item.dealerCode}}</td>
              <td>服务中心名称：</td>
              <td>{{item.dealerName}}</td>
            </tr>
            <tr>
              <td class="tdsubtitle" colspan="2">保修相关信息：</td>
              <td colspan="2"></td>
            </tr>
            <tr>
              <td>开单日期：</td>
              <td>{{transformDate(item.createTime)}}</td>
              <td>行驶里程：</td>
              <!-- TODO 待确定 -->
              <td>3,100.00</td>
            </tr>
            <tr>
              <td>施工单号：</td>
              <td colspan="3">{{item.serviceProxyNo}}</td>
            </tr>
            <tr>
              <td>保修类型：</td>
              <td>{{item.repairItemTypeName}}</td>
              <td>保修申请单号：</td>
              <td>{{item.warrantyNo}}</td>
            </tr>
            <tr>
              <td>故障现象：</td>
              <td colspan="3">
                <div style="width:100%;">送修人在正常行驶中，ABS故障灯亮</div>
              </td>
            </tr>
            <tr>
              <td>排查过程：</td>
              <td colspan="3">
                <div style="width:100%;">
                  2：经检查胎压灯常亮报警，可复现
                  3：该故障无技术报告
                  4：经检查该部位无碰撞。无改装、维修历史无该部位维修记录
                  5：该轮速传感器线路连接正常
                  6：经技术确认需更换左后轮速传感器、更换后故障排除
                  7：该方案符合最小件原则
                  备注：1：因订货周期超过5天，申请交通补偿（见附件）
                  2.车辆进店日期（ 2025年3月1日），离店日期是（2025
                  年3月14日），第六天从（ 2025年3月8日）开始至
                  （ 2025年3月110日）结束，共计补贴天数（3）天；
                  3.补偿单价（ 200*3天=600）元，不含税补贴费用合计
                  （600）元；
                  4.税率6%，税费=（600*6%=36 ）元；
                  合计总计费用（600+36=636 ）元；
                </div>
              </td>
            </tr>
            <tr>
              <td class="tdsubtitle">车辆信息：</td>
              <td colspan="3"></td>
            </tr>
            <tr>
              <td>车型：</td>
              <td>C11-580尊享版</td>
              <td>车牌号：</td>
              <td>川ABX3573</td>
            </tr>
            <tr>
              <td>车架号：</td>
              <td colspan="3">LFZ63AL54SD245658</td>
            </tr>
            <tr>
              <td>动力电池编码：</td>
              <td colspan="3">0K1PB4M0AG000BF4N0000175</td>
            </tr>
            <tr>
              <td>驱动电机编码：</td>
              <td colspan="3">--</td>
            </tr>
            <tr>
              <td>生产日期：</td>
              <td>--</td>
              <td>销售日期：</td>
              <td>2025/5/6</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="divRight">
        <table style="margin-left:5%;">
          <tbody>
            <tr>
              <td>
                <div id="dv_qrcode0" data-value="33A10SC204W25120068-1" title="33A10SC204W25120068-1">
                  <canvas width="100" height="100" style="display: none;"></canvas>
                  <qrcode-vue :value="'https://www.baidu.com/'" renderAs="svg" :size="100" level="H"></qrcode-vue>
                </div>
              </td>
              <td colspan="3">33A10SC204W25120068-1</td>
            </tr>
            <tr>
              <td></td>
              <td>
                <div class="divlabel">
                  <span class="span1">主</span>
                </div>
              </td>
              <td>
                <div>
                  <span class="span2">1 - 1</span>
                </div>
              </td>
              <td></td>
            </tr>
            <tr>
              <td>保修旧件编码：</td>
              <td colspan="3">8061003-CA01</td>
            </tr>
            <tr>
              <td>保修旧件名称：</td>
              <td colspan="3">主刮片</td>
            </tr>
            <tr>
              <td>数量：</td>
              <td colspan="3">1</td>
            </tr>
            <tr>
              <td>供应商代码：</td>
              <td colspan="3">上海万江汽车零部件有限公司</td>
            </tr>
            <tr>
              <td>供应商名称：</td>
              <td colspan="3">6GB</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script>
import QrcodeVue from 'qrcode.vue';
export default {
  components: {
    QrcodeVue,
  },
  props: {
    id: {
      type: String,
      default: ''
    },
    data: {
      type: Array,
      default: () => ([])
    }
  },
  data () {
    return {
      info: {}
    };
  },
  watch: {
    id: function (val) {
      if (val) {
        this.getData();
      }
    }
  },
  mounted () {
  },
  methods: {
    getData () {
      // getDetail(this.id).then(res => {
      //   this.info = res;
      // });
    },
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
      const h = date.getHours();
      const m = date.getMinutes();
      return `${Y}/${M}/${D} ${h}/${m}`;
    }
  },
};
</script>
<style lang="scss" scoped>

@media print {
  div {
    page-break-inside: avoid;
  }
}

.divlabel {
  text-align: center;
  height: 100px;
  position: relative;
}

.divlabel .span1 {
  bottom: 39px;
  position: absolute;
  font-size: xx-large;
}

.divlabel .span2 {
  position: absolute;
  bottom: 50px;
  margin-left: -25px;
}

.divMain {
  margin-bottom: 10px;
  padding-bottom: 10px;
  // height: 465px;
  border-bottom: dashed;
  display: flex;
}

.divLeft {
  // float: left;
  border-right-style: dashed;
  border-top-style: solid;
  border-left-style: solid;
  border-bottom-style: solid;
  // height: 450px;
}

.divRight {
  // float: left;
  border-right-style: solid;
  border-top-style: solid;
  border-bottom-style: solid;
  // height: 450px;
}

.tdtitle {
  padding-left: 10px;
  font-size: 23px;
  font-weight: bold;
  padding-bottom: 10px;
}

.tdsubtitle {
  font-size: 15px;
  font-weight: bold;
}

table {
  width: 500px;
  height: 360px;
  margin-bottom: 10px;
  font: small;
  margin: 15px;
  table-layout: fixed;
  word-break: break-all;
  font-size: x-small;
  letter-spacing: 1px;
}

td {}

td:nth-child(odd) {
  width: 190px;
}

/* 应用这个样式的，从那个标签结束开始另算一页，之后在遇到再起一页，以此类推 */
.PageNext {
  page-break-after: always;
  margin-bottom: 30px;
}
</style>
