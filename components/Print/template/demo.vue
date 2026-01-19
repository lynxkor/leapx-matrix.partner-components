<!--
  开发步骤：
  1. 拷贝本页面代码，重命名为新打印模版页面
  2. 从老销服拷贝打印页面，拷贝并替换#printArea区域
  3. 所有有id标签的地方，修改为vue模版代码动态字段
  4. 开发接口获取数据
-->
<template>
  <!-- 以下内容请从销服老系统对应模块拷贝，修改动态字段  -->
  <div id="printArea" style="width: 1000px; text-align: center">
    <div>
      <table class="pageTitle">
        <tbody>
          <tr>
            <td style="width: 30%; text-align: left" id="dealername"></td>
            <td style="width: 40%; text-align: center" rowspan="3">
              <h2>接车施工单</h2>
            </td>
            <td style="width: 30%; text-align: right" rowspan="3">
              <img id="logoID" :src="require('@/libs/assets/images/logo.png')" />
            </td>
          </tr>
          <tr>
            <td style="text-align: left" id="parentdealername">{{ info.activityName }}</td>
          </tr>
          <tr>
            <td style="text-align: left" id="dealerphone">{{ info.activityStatusLabel }}</td>
          </tr>
          <tr>
            <td style="text-align: left" id="dealeraddress">{{ info.actualDealerName }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <table class="gridtable">
        <tbody>
          <tr>
            <td
              style="
                width: 20px;
                padding: 3px;
                border-right-width: 0px;
                background-color: #00b2f2;
                vertical-align: middle;
              "
            >
              车辆状态确认
            </td>
            <td style="padding: 0px; border: 0px">
              <table style="width: 100%" class="gridtable">
                <tbody>
                  <tr>
                    <td style="width: 100px">开单时间</td>
                    <td style="width: 150px" id="createdon">{{ info.createTime }}</td>
                    <td style="width: 100px">单据编号</td>
                    <td style="width: 150px" id="mcs_name"></td>
                    <td style="width: 100px">VIN码</td>
                    <td
                      style="width: 100px"
                      id="_mcs_vincar_value_formatted"
                    ></td>
                    <td style="width: 100px">预计交车时间</td>
                    <td
                      style="width: 100px"
                      id="mcs_expectfinishat_formatted"
                    ></td>
                  </tr>
                  <tr>
                    <td>车牌号码</td>
                    <td id="mcs_carplate"></td>
                    <td>型号</td>
                    <td id="_mcs_carmodel_value_formatted"></td>
                    <td>车主</td>
                    <td id="mcs_customername"></td>
                    <td>电话</td>
                    <td id="mcs_customerphone"></td>
                  </tr>
                  <tr>
                    <td>进店里程(Km)</td>
                    <td id="mcs_mileage_formatted"></td>
                    <td>进店电量%</td>
                    <td id="mcs_inpower"></td>
                    <td>送修人：</td>
                    <td id="mcs_shuttlename"></td>
                    <td>销售日期</td>
                    <td id="mcs_saledate"></td>
                  </tr>
                  <tr>
                    <td>离店里程(Km)</td>
                    <td id="mcs_departuremileage"></td>
                    <td>离店电量%</td>
                    <td id="mcs_outpower_formatted"></td>
                    <td>送修人手机</td>
                    <td id="mcs_shuttlephone"></td>
                    <td>客户经理</td>
                    <td id="_mcs_serviceadvisorid_value"></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px">客户地址</td>
                    <td
                      colspan="7"
                      id="mcs_customeraddr"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px; height: 40px">
                      客户诉求
                    </td>
                    <td
                      colspan="7"
                      id="mcs_customercomment"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px; height: 40px">
                      故障描述
                    </td>
                    <td
                      colspan="7"
                      id="mcs_customercontent"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px; height: 40px">
                      维修建议
                    </td>
                    <td
                      colspan="7"
                      id="mcs_testresult"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px; height: 40px">
                      拆解说明
                    </td>
                    <td
                      colspan="7"
                      id="mcs_disassemblyinstructions"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px; height: 40px">
                      路试说明
                    </td>
                    <td
                      colspan="7"
                      id="mcs_roadtestdescription"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                  <tr>
                    <td style="border-bottom-width: 0px; height: 40px">
                      异常描述
                    </td>
                    <td
                      colspan="7"
                      id="mcs_anomalydescription"
                      style="border-bottom-width: 0px; text-align: left"
                    ></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td
              style="
                width: 20px;
                padding: 3px;
                border-right-width: 0px;
                background-color: #ca001b;
                vertical-align: middle;
              "
            >
              故障信息
            </td>
            <td style="padding: 0px; border: 0px">
              <table style="width: 100%" class="gridtable">
                <tbody>
                  <tr>
                    <td
                      style="
                        border-bottom-width: 0px;
                        background-color: #d9ecf8;
                        text-align: left;
                      "
                    >
                      故障模块
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0px; border: 0px">
                      <table class="gridtable">
                        <thead>
                          <tr>
                            <th style="width: 60px">VRT名称</th>
                            <th style="width: 120px">VFG名称</th>
                            <th style="width: 150px">CCC名称</th>
                          </tr>
                        </thead>
                        <tbody id="fault-list"></tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td
              style="
                width: 20px;
                padding: 3px;
                border-right-width: 0px;
                background-color: #ca8c00;
              "
              rowspan="7"
            >
              维修项目内容确认
            </td>
            <td style="padding: 0px; border: 0px">
              <table class="gridtable">
                <tbody>
                  <tr>
                    <td
                      style="
                        border-bottom-width: 0px;
                        background-color: #d9ecf8;
                        text-align: left;
                      "
                    >
                      维修工时
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0px; border: 0px">
              <table class="gridtable">
                <thead>
                  <tr>
                    <th style="width: 60px">序号</th>
                    <th style="width: 100px">维修类型</th>
                    <th style="width: 120px">工时代码</th>
                    <th style="width: 150px">维修项目名称</th>
                    <th style="width: 100px">结算类型</th>
                    <th style="width: 60px">工时</th>
                    <th style="width: 60px">工时单价</th>
                    <th style="width: 60px">优惠金额</th>
                    <th style="width: 60px">工时费用</th>
                    <th style="width: 60px">是否增项</th>
                  </tr>
                </thead>
                <tbody id="data-list"></tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0px; border: 0px">
              <table class="gridtable">
                <tbody>
                  <tr>
                    <td
                      style="
                        border-bottom-width: 0px;
                        background-color: #d9ecf8;
                        text-align: left;
                      "
                    >
                      维修备件
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0px; border: 0px">
              <table class="gridtable">
                <thead>
                  <tr>
                    <th style="width: 60px">序号</th>
                    <th style="width: 100px">维修类型</th>
                    <th style="width: 120px">备件代码</th>
                    <th style="width: 150px">备件名称</th>
                    <th style="width: 100px">结算类型</th>
                    <th style="width: 60px">数量</th>
                    <th style="width: 60px">单价</th>
                    <th style="width: 60px">优惠金额</th>
                    <th style="width: 60px">备件金额</th>
                    <th style="width: 60px">是否增项</th>
                    <th style="width: 60px">是否原厂</th>
                  </tr>
                </thead>
                <tbody id="part-list"></tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0px; border: 0px">
              <table class="gridtable">
                <tbody>
                  <tr>
                    <td
                      style="
                        border-bottom-width: 0px;
                        background-color: #d9ecf8;
                        text-align: left;
                      "
                    >
                      费用估算
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0px; border: 0px">
              <table class="gridtable">
                <tbody>
                  <tr>
                    <td
                      rowspan="4"
                      style="width: 100px; border-bottom-width: 0px"
                    >
                      费用结算<br />(估算费用与实际结算金额差异15%内）
                    </td>
                    <td style="width: 150px">工时费用小计：</td>
                    <td style="width: 180px" id="repairamountsub"></td>
                    <td
                      rowspan="4"
                      style="width: 100px; border-bottom-width: 0px"
                    >
                      结算类型
                    </td>
                    <td style="width: 150px">自费金额估算：</td>
                    <td id="selfpayamount_total"></td>
                  </tr>
                  <tr>
                    <td>备件费用小计</td>
                    <td id="mamountsub"></td>
                    <td>保险金额估算</td>
                    <td id="insuranceamount_total"></td>
                  </tr>
                  <tr>
                    <td>优惠金额小计</td>
                    <td id="mcs_discountamount_total"></td>
                    <td>内转金额估算</td>
                    <td id="internalamount_total"></td>
                  </tr>
                  <tr>
                    <td>本次维修估算费用</td>
                    <td id="mcs_payableamount_total"></td>
                    <td>其他</td>
                    <td id="otheramount_total"></td>
                  </tr>
                  <tr>
                    <td style="height: 40px">客户经理确认</td>
                    <td colspan="2"></td>
                    <td>客户签字</td>
                    <td colspan="2" id="mcs_snap_ticket"></td>
                  </tr>
                  <tr>
                    <td>日期</td>
                    <td colspan="2"></td>
                    <td>日期</td>
                    <td colspan="2" id="mcs_signcompletedon_formatted"></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="page-break-after: always"></div>
    <div>
      <table class="gridtable">
        <tbody>
          <tr>
            <td
              colspan="2"
              id="disclaimer"
              style="
                text-align: left;
                font-size: 12px;
                line-height: 2;
                font-weight: bold;
              "
            >
              <pre class="content">
                在接受本协议之前，请您仔细阅读本协议的全部内容。您确认或签名后，即视为您已确认并同意：
                1）按本协议内容履行，如产生您相关责任的，同意承担相应法律责任；
                2）零跑服务中心及其关联方根据相关法律法规的规定收集您的相关信息（包括车辆信息）用以建立修理记录存档制度。
                如果您对本协议的条款有疑问，您可向服务中心相关工作人员进行咨询，其将向您解释条款内容。如您不同意本协议的任何内容或无法准确理解条款含义及解释，请不要进行
                后续操作。

                                                                                    零跑维保服务协议
                本服务协议是用户使用维修保养服务的重要前提和条件，用户在勾选前请仔细阅读协议内容，一经勾选视为用户已经知悉并同意协议内容，用户通过电子方式签署后协议生效。
                本协议为“零跑授权门店”（以下简称“零跑服务中心”）与零跑车辆所有权人或取得车辆所有权人全权授权的代理人（以下简称“用户”）就零跑车辆检测、售后维修、保养等服务（以下简称“维修”）的相关事项所订立的有效合约。
                1.用户同意本服务协议，即被视为有权或已被授权向零跑服务中心提出有关车辆检测、维修、保养等要求并同意零跑服务中心进行相关的检测、维修（包括必要时对车辆相关部位进行拆解）、保养及必要合理的厂外路试等，并对由此产生的费用（具体以《结算单》为准）负有全额支付的义务。如用户未获得合法授权而导致的侵权索赔等纠纷的，由用户承担由此产生的法律责任。
                2基于故障定位、故障原因分析、潜在故障风险排査、清理故障码等诊断、维保、检车的需要，用户同意零跑服务中心执行必要的车端数据采集（包括但不限于车主或授权用车人个人数据、整车标识信息、车辆配置信息、车辆运行数据、车辆行驶数据、座舱相关数据、运维数据、授权服务中心出入记录等）、控车权限并与零跑汽车进行必要的分享以便提供技术支持。用户接受并认可，基于现有维修条件，维修行为可能导致系统数据被删改、系统被重启/重置。
                3.由零跑服务中心所提供报价或估计完工时间等，可能会因在实际施工过程的具体情况而出现事先无法预知的价格变动，当出现或可能出现这种价格变动时，零跑服务中心将另行通知用户，零跑服务中心将在维修交车前提供结算单，其列明的总额是双方对于维修、保养费总金额的最终有效约定。结算单一经用户同意，即视为用户确认并认可其上所列各维修项目均已完成，对其上所列各维修项目所对应的工时费、材料费等费用的收费标准和计算方式均无异议，并同意按照该结算单列明总金额支付全部费用。
                4.由用户委托零跑服务中心进行检测、维修、保养的车辆，如用户在收到口头、电话或者书面的维修通知、完工通知或其他类似通知未有明确表示同意进行维修、保养，或未在约定日期到店取车时，零跑服务中心有权收取停车费、车辆保管费，在此期间车辆的自然损耗（包括但不限于轮胎老化、变形、零部件锈蚀、外表漆面老化褪色等）及车辆毁损、灭失、任何因车辆引起的或与车辆有关的须向第三方承担的责任及任何非因零跑服务中心原因造成的风险均由用户自行承担。
                5.经由零跑服务中心检验后之车辆，如用户决定不再维修或不同意零跑服务中心的维修方案导致车辆无法及时维修的，由此产生的车辆故障等安全风险及不利后果均由用户自行承担，且零跑服务中心将会按店内相关标准收取检测费用、工时费等相关费用。
                6.用户知悉并同意：经由零跑服务中心检测后，如需对车辆电池进行检测或维修，零跑服务中心有权将电池检测、维修项目委托零跑授权的电池维修中心提供相应服务，且零跑服务中心将会按店内相关标准收取检测或维修等相关费用。
                7.零跑服务中心将会竭尽全力为用户提供高质量的服务。但对于非零跑服务中心原因，包括但不限于交通事故、火灾、水灾、冰雹、暴乱、电力系统故障、网络故障、计算机病毒侵入、计算机系统被破坏或瘫痪、政策法规变化、爆炸、传染病、污染或任何非零跑服务中心能力范围所能控制之情况所引起对用户车辆或车内物件造成的损坏或损失，零跑服务中心将不承担任何违约或赔偿责任。
                8.用户将车辆交给零跑服务中心时，应自行清点并取走车内的所有贵重物品，请勿遗留贵重物品在车内，如：现金、手机、有价证券、重要资料的纸质文件/存储介质等。零跑服务中心有权拒绝用户提出的任何财物遗失或类似的索赔主张。用户同意本协议即被视为已清点并取走自己的财物。服务结束后交还车辆时，用户应立即对车辆外观和车内物品进行检查，若用户主动放弃检查确认或在交接车辆时未提出异议则视为车辆及车内财物无丢失或损坏。
                9.零跑服务中心将不会在任何情况下负责赔偿维修车辆或车内物件在零跑服务中心，或在零跑服务中心控制范围内，或在交收车辆途中发生的损失。除非该损失被证实是因为零跑服务中心雇员的故意行为或重大过失所造成。
                10.若因用户原因造成车辆损坏（如交通事故等），用户应自行向责任方追讨赔偿或与自己的保险公司协商保险赔偿事宜，零跑服务中心将不会代用户进行上述索赔事宜的处理；用户不得以自己未获得赔偿或以赔偿事宜未得到解决为由拒绝向零跑服务中心支付应付的维修费用（但双方另有书面约定的除外）。
                11. 用户知悉使用自备或非零跑原厂零部件、物料等可能产生的风险等，并已充分向零跑服务中心了解情况并接受可能产生的不利后果。零跑服务中心与用户达成一致使用自备或非零跑原厂零部件、物料的，由此造成的质量问题、质保等减损风险与不利后果由用户承担。零跑汽车品牌对因此产生的任何损失不承担责任。
                12.若零跑服务中心认为车辆需进行双方事先确认范围以外的维修的以确保车辆有安全良好的道路行驶状态，零跑服务中心将尽力联络用户（或其授权人），以便在获得授权后进行该维修工作；当无法联络到用户或其授权人以获取明确指示时，零跑服务中心将不会单方面进行该项维修，而仅在事先确认范围内进行维修。
                13.在进行车辆检测、维修、保养、路试或交收过程中所产生的电能消耗，除另有约定外，由用户自行承担。
                14.在用户尚未全部付清应付费用的情况下，零跑服务中心有权对其车辆行使留置权。
                15. 在零跑服务中心进行车辆检测、维修、保养、路试、交收等过程中时，如非因零跑服务中心雇员的故意行为或无证驾驶行为而发生的交通意外事故，用户须协助零跑服务中心按保险理赔流程进行后续的车辆维修；对于保险理赔未能覆盖的部分，用户授权零跑服务中心对车辆进行维修。除此之外，零跑服务中心无需承担任何其他责任（例如赔偿客户的任何间接损失、车辆贬值损失等）。
                16.用户授权零跑服务中心、零跑汽车及其关联方将严格按照法律法规及隐私政策的规定，采集、使用、处理用户提供的信息，以确保按照相关法律法规的规定建立修理记录存档制度。除法规明确规定情形和/或取得用户同意外，零跑服务中心、零跑汽车及其他关联方不会向第三方透露该等的信息。
                17. 为确保向用户提供实况播放服务，用户同意并授权零跑服务中心、零跑汽车及关联方采集用户车辆维修、保养等过程中的实时影像（影像可能包含车牌等信息），该实时影像仅零跑服务中心、用户或用户授权人可查看，零跑服务中心、零跑汽车及关联方不会对外传播。在此，零跑服务中心温馨提示用户切勿对外传播该影像，否则因此带来的不便或造成的任何损失皆由用户自行承担。
                18. 用户应妥善保管零跑APP的账号及密码，不向其他任何人泄露。由于用户将个人密码告知他人或者与他人共享账户的，由此导致的任何个人资料泄露或与售后服务有关的一切财产损失，零跑服务中心及零跑汽车对此不承担任何责任。
                19. 用户同意，本协议及相关单据签署（含环车检查结果、施工单、结算单）及留存均采用电子方式。本协议一经用户确认，即视为用户已阅读并同意本协议，自愿接受本协议所有内容的约束。
                20. 与本协议有关的争议，应友好协商解决，协商不能解决的，适用中华人民共和国法律由零跑服务中心所在地有管辖权的人民法院管辖。
              </pre>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
// 对应业务的接口
// import { getDetail } from '@/api/claimreturn/claim/basic/serviceActivityVehicle';

export default {
  props: {
    id: {
      type: String,
      default: ''
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      info: {}
    };
  },
  watch: {
    id: {
      handler (val) {
        if (val) {
          this.info = {};
          this.getData();
        }
      },
      immediate: true
    }
  },
  methods: {
    getData () {
      // getDetail(this.id).then(res => {
      //   this.info = res;
      // });
    }
  },
};
</script>
<style lang="scss" scoped>
// 已经在index.vue中注入公共样式，若样式不正常，视情况修改
</style>
