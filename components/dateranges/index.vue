<script>
/**
 * 时间范围选择器组件
 * @author sihongyu
 * @description 基于 `el-date-picker` 实现的时间范围选择器组件，支持多种快捷时间选项（如本周、本月、最近一周等），
 *              并提供时间范围限制、默认时间设置、时间变化回调等功能。
 * @param {Object} form - 父组件传递的表单对象，用于绑定表单数据。
 * @param {Number} limtNum - 时间范围限制，默认限制为12个月。
 * @param {Function} changeNewTime - 暴露给父组件的时间变化回调函数，当时间范围变化时触发。
 * @param {Boolean} setDefault - 是否设置默认时间，默认为 `false`。
 * @param {String} deftTime - 默认时间类型（如 "本周"、"本月" 等），仅在 `setDefault` 为 `true` 时生效。
 * @param {Number} upToTodayStart - 截至到今天的起始时间，默认为 2018-01-01 的时间戳。
 *
 * @event $attrs - 绑定所有父组件的属性到子组件的 `el-date-picker` 元素上。
 * @event changeNewTime - 时间范围变化时触发，返回选中的时间范围值。
 *
 * @example
 * 使用默认时间设置
 * <date-range-picker
 *   v-model="createTime"
 *   ref="createTime"
 *   :limtNum="12"
 *   :setDefault="true"
 *   deftTime="本周"
 *   @changeNewTime="(value) => changeNewTime(value, 'createTime')"
 * />
 *
 * @example
 * 使用自定义时间范围限制
 * <date-range-picker
 *   v-model="createTime"
 *   ref="createTime"
 *   :limtNum="6"
 *   @changeNewTime="(value) => changeNewTime(value, 'createTime')"
 * />
 *
 * @example
 * 使用快捷选项和时间范围限制
 * <date-range-picker
 *   v-model="createTime"
 *   ref="createTime"
 *   :limtNum="12"
 *   :setDefault="false"
 *   @changeNewTime="(value) => changeNewTime(value, 'timeRange')"
 * />
 * methods
 *  changeNewTime (value, key) {
 *    if (value) {
 *      this.form[`${key}Start`] = value[0];
 *     this.form[`${key}End`] = value[1];
 *   } else {
 *      this.form[`${key}Start`] = '';
 *      this.form[`${key}End`] = '';
 *    }
 *  },
 *
 *  onReset () {
 *    this.form = { ...defaultForm };
 *    this.createTime = [];
 *    this.$refs.createTime.clearTime();
 *    this.getData();
 *   },
 */
</script>
<template>
  <el-col :span="24" style="height: 100%">
    <el-date-picker
      :default-time="['00:00:00', '23:59:59']"
      format="yyyy-MM-dd HH:mm:ss"
      value-format="yyyy-MM-dd HH:mm:ss"
      v-model="time2"
      type="datetimerange"
      range-separator="/"
      popper-class="data-style"
      @change="changeTime"
      :clearable="true"
      unlink-panels
      :picker-options="pickerOptions"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      v-bind="$attrs"
    >
    </el-date-picker>
  </el-col>
</template>

<script>
import { formatDateTime } from '@/utils';

export default {
  props: {
    form: {
      type: Object
    },
    limtNum: {
      type: Number,
      default: 12 // 限制范围12个月
    },
    // 暴露出去change事件
    changeNewTime: {
      type: Function
    },
    setDefault: {
      type: Boolean,
      default: false
    },
    deftTime: {
      type: String,
      default: ''
    },
    // 截至到今天的起始时间外部处理
    upToTodayStart: {
      type: Number,
      default: () => new Date(2018, 0, 1).getTime()
    }
  },
  data () {
    const that = this;
    return {
      time2: [],
      minDate: '',
      pickerOptions: {
        shortcuts: [
          {
            text: '本周',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '本周');
              // console.log(res, '本周');
              picker.$emit('pick', res);
            }
          },
          {
            text: '本月',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '本月');
              picker.$emit('pick', res);
            }
          },
          {
            text: '上月',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '上月');
              picker.$emit('pick', res);
            }
          },
          {
            text: '本季度',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '本季度');
              picker.$emit('pick', res);
            }
          },
          {
            text: '本年',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '本年');
              picker.$emit('pick', res);
            }
          },
          {
            text: '上周',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '上周');
              picker.$emit('pick', res);
            }
          },
          {
            text: '上季度',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '上季度');
              picker.$emit('pick', res);
            }
          },
          {
            text: '去年',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '去年');
              picker.$emit('pick', res);
            }
          },
          {
            text: '昨日',
            onClick (picker) {
              const oneDays = 3600 * 1000 * 24;
              const res = that.unifiedHandlData(oneDays);
              picker.$emit('pick', res);
            }
          },
          {
            text: '最近3天',
            onClick (picker) {
              const threeDays = 3600 * 1000 * 24 * 3;
              const res = that.unifiedHandlData(threeDays);
              picker.$emit('pick', res);
            }
          },
          {
            text: '最近一周',
            onClick (picker) {
              const sevenDays = 3600 * 1000 * 24 * 7;
              const res = that.unifiedHandlData(sevenDays);
              picker.$emit('pick', res);
            }
          },
          {
            text: '最近一个月',
            onClick (picker) {
              const thirtyDays = 3600 * 1000 * 24 * 30;
              const res = that.unifiedHandlData(thirtyDays);
              picker.$emit('pick', res);
            }
          },
          {
            text: '最近三个月',
            onClick (picker) {
              const ninetyDays = 3600 * 1000 * 24 * 91;
              const res = that.unifiedHandlData(ninetyDays);
              picker.$emit('pick', res);
            }
          },
          {
            text: '最近半年',
            onClick (picker) {
              const oneHundredAndTwenty = 3600 * 1000 * 24 * 180;
              const res = that.unifiedHandlData(oneHundredAndTwenty);
              console.log(res, 'res');
              picker.$emit('pick', res);
            }
          },

          {
            text: '今天截止',
            onClick (picker) {
              const res = that.unifiedHandlData(0, '今天截止');
              picker.$emit('pick', res);
            }
          }
        ],
        onPick: ({ maxDate, minDate }) => {
          this.minDate = minDate;
        },
        disabledDate: (time) => {
          var mindate2 = new Date('2018/01/01').getTime();
          return time.getTime() < mindate2;
        }
      }
    };
  },
  watch: {
    minDate (e) {
      this.pickerOptions = {
        disabledDate: (time) => {
          var c = e;
          var a = e.setMonth(e.getMonth() + this.limtNum);
          var b = c.setMonth(c.getMonth() - this.limtNum);
          var d = new Date(b).setMonth(new Date(b).getMonth() - this.limtNum);
          return time.getTime() > a || time.getTime() < d;
        }
      };
    },
    time2 (e) {
      if (!e) {
        this.time2 = [];
      } else {
        this.time2 = e;
      }
    }
  },
  created () {
    this.setDefaultTime();
  },
  methods: {
    setDefaultTime () {
      if (this.setDefault) {
        // const time = new Date();
        let time = this.unifiedHandlData(0, this.deftTime);
        console.log(time);
        const time1 = formatDateTime(time[0], 'data');
        // console.log('time1', time1);
        const time2 = formatDateTime(time[1], 'data');
        // eslint-disable-next-line no-useless-concat
        this.time2.splice(0, 1, time1 + ' ' + '00' + ':00' + ':00');
        // eslint-disable-next-line no-useless-concat
        this.time2.splice(1, 1, time2 + ' ' + '23' + ':59' + ':59');
        this.changeTime(this.time2);
      }
    },
    changeTime (value) {
      this.$emit('changeNewTime', value);
    },
    clearTime () {
      this.time2 = [];
    },
    unifiedHandlData (days = 0, type = '') {
      const oneDay = 24 * 60 * 60 * 1000;
      console.log(oneDay);
      const endTsFn = 23 * 60 * 60 * 1000 + 59 * 60 * 1000; // 23分59秒  总毫秒数
      const start = new Date(new Date().toDateString());
      const end = new Date(start - 0 + 24 * 60 * 60 * 1000 - 1);
      const now = new Date();
      var nowDayOfWeek;
      if (now.getDay() === 0) {
        nowDayOfWeek = 6;
      } else {
        nowDayOfWeek = now.getDay() - 1; // 今天本周的第几天
      }
      const nowDay = now.getDate(); // 当前日
      const nowMonth = now.getMonth(); // 当前月
      const nowYear = now.getFullYear(); // 当前年
      const jd = Math.ceil((nowMonth + 1) / 3); // 当前季度
      const sjd = Math.ceil((nowMonth + 1) / 3 - 1); // 上个季度
      // const lastMonthDate = new Date();
      // const lastMonth = lastMonthDate.getMonth()
      const currWeekStartTime = new Date(
        nowYear,
        nowMonth,
        nowDay - nowDayOfWeek
      ).getTime(); // 本周开始时间
      const currWeekEndTime =
        new Date(nowYear, nowMonth, nowDay + (6 - nowDayOfWeek)).getTime() +
        endTsFn;
      const currMonthStartTime = new Date(nowYear, nowMonth, 1).getTime(); // 本月开始时间
      const currMonthEndTime =
        new Date(nowYear, nowMonth + 1, 0).getTime() + endTsFn;
      const lastStartMonth = new Date(nowYear, nowMonth - 1, 1).getTime(); // 上月开始
      const weekStartDate = new Date(
        nowYear,
        nowMonth,
        nowDay - nowDayOfWeek - 7
      );
      const weekEndDate =
        new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 1).getTime() +
        endTsFn;

      const lastEndMonth =
        new Date(nowYear, nowMonth - 1 + 1, 0).getTime() + endTsFn;
      const lastStartJDTime = new Date(nowYear, (jd - 1) * 3, 1).getTime();
      const lastEndJDTime = new Date(nowYear, jd * 3, 0).getTime() + endTsFn;
      const lastStartSJDTime = new Date(nowYear, (sjd - 1) * 3, 1).getTime();
      const lastEndSJDTime = new Date(nowYear, sjd * 3, 0).getTime() + endTsFn;
      const lastStartYearTime = new Date(nowYear, 0, 1).getTime(); // 本年第一天
      const lastEndYearTime = new Date(nowYear, 11, 31).getTime() + endTsFn; // 本年最后一天
      const lastYearTime = new Date(nowYear - 1, 0, 1).getTime(); // 去年开始第一天
      const lastYeatEnd = new Date(nowYear - 1, 11, 31).getTime() + endTsFn; // 去年最后一天
      switch (type) {
        case '今天':
          break;
        case '本周':
          start.setTime(currWeekStartTime);
          end.setTime(currWeekEndTime);
          break;
        case '本月':
          start.setTime(currMonthStartTime);
          end.setTime(currMonthEndTime);
          break;
        case '上月':
          start.setTime(lastStartMonth);
          end.setTime(lastEndMonth);
          break;
        case '本季度':
          start.setTime(lastStartJDTime);
          end.setTime(lastEndJDTime);
          break;
        case '本年':
          start.setTime(lastStartYearTime);
          end.setTime(lastEndYearTime);
          break;
        case '上周':
          start.setTime(weekStartDate);
          end.setTime(weekEndDate);
          break;
        case '上季度':
          start.setTime(lastStartSJDTime);
          end.setTime(lastEndSJDTime);
          break;
        case '去年':
          start.setTime(lastYearTime);
          end.setTime(lastYeatEnd);
          break;
        case '今天截止':
          // start.setTime(null);
          start.setTime(this.upToTodayStart);
          end.setTime(end.getTime());
          break;

        default:
          start.setTime(start.getTime() - days);
          // 截至到昨天
          end.setTime(end.getTime() - oneDay);
      }
      // console.log([start, end], '@@@@');
      return [start, end];
    }
  }
};
</script>

<style lang="scss" scoped>
::v-deep .el-picker-panel__sidebar {
  overflow: scroll !important;
}
::v-deep .el-range-editor.el-input__inner {
  width: 28.5rem !important;
}
::v-deep .el-date-editor .el-range-input::placeholder {
  color: #888888;
}
::v-deep .el-date-editor .el-range__icon {
  // color:#98BFC3
}
</style>
