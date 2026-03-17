/**
 * 根据中文时间段获取时间范围
 * @param {string} type - 中文时间段类型
 * @returns {Object} { startTime, endTime } 格式为时间戳
 *
 * @example
 * // 使用示例
 * const { startTime, endTime } = getTimeRangeByType('本周');
 * // 或指定天数
 * const { startTime, endTime } = getTimeRangeByType('最近 7 天', 7);
 */
export function getTimeRangeByType (type = '', days = 0) {
  const oneDay = 24 * 60 * 60 * 1000;
  const endTsFn = 23 * 60 * 60 * 1000 + 59 * 60 * 1000; // 23:59:59 的毫秒数
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

  // 本周开始结束时间
  const currWeekStartTime = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek).getTime();
  const currWeekEndTime = new Date(nowYear, nowMonth, nowDay + (6 - nowDayOfWeek)).getTime() + endTsFn;

  // 本月开始结束时间
  const currMonthStartTime = new Date(nowYear, nowMonth, 1).getTime();
  const currMonthEndTime = new Date(nowYear, nowMonth + 1, 0).getTime() + endTsFn;

  // 上月开始结束时间
  const lastStartMonth = new Date(nowYear, nowMonth - 1, 1).getTime();
  const lastEndMonth = new Date(nowYear, nowMonth, 0).getTime() + endTsFn;

  // 上周开始结束时间
  const weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 7);
  const weekEndDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 1).getTime() + endTsFn;

  // 本季度开始结束时间
  const lastStartJDTime = new Date(nowYear, (jd - 1) * 3, 1).getTime();
  const lastEndJDTime = new Date(nowYear, jd * 3, 0).getTime() + endTsFn;

  // 上季度开始结束时间
  const lastStartSJDTime = new Date(nowYear, (sjd - 1) * 3, 1).getTime();
  const lastEndSJDTime = new Date(nowYear, sjd * 3, 0).getTime() + endTsFn;

  // 本年开始结束时间
  const lastStartYearTime = new Date(nowYear, 0, 1).getTime();
  const lastEndYearTime = new Date(nowYear, 11, 31).getTime() + endTsFn;

  // 去年开始结束时间
  const lastYearTime = new Date(nowYear - 1, 0, 1).getTime();
  const lastYeatEnd = new Date(nowYear - 1, 11, 31).getTime() + endTsFn;

  switch (type) {
    case '今天':
      start.setTime(start.getTime());
      end.setTime(end.getTime() - oneDay);
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
    case '昨天':
      start.setTime(start.getTime() - oneDay);
      end.setTime(end.getTime() - oneDay);
      break;
    case '最近 3 天':
      start.setTime(start.getTime() - 3 * oneDay);
      end.setTime(end.getTime() - oneDay);
      break;
    case '最近一周':
      start.setTime(start.getTime() - 7 * oneDay);
      end.setTime(end.getTime() - oneDay);
      break;
    case '最近一个月':
      start.setTime(start.getTime() - 30 * oneDay);
      end.setTime(end.getTime() - oneDay);
      break;
    case '最近三个月':
      start.setTime(start.getTime() - 90 * oneDay);
      end.setTime(end.getTime() - oneDay);
      break;
    case '最近半年':
      start.setTime(start.getTime() - 180 * oneDay);
      end.setTime(end.getTime() - oneDay);
      break;
    default:
      // 支持自定义天数，如 '最近 7 天' 传 days = 7
      if (days > 0) {
        start.setTime(start.getTime() - days * oneDay);
        end.setTime(end.getTime() - oneDay);
      } else {
        start.setTime(start.getTime());
        end.setTime(end.getTime());
      }
  }

  return {
    startTime: start.getTime(),
    endTime: end.getTime()
  };
}

/**
 * 根据中文时间段获取格式化时间范围 (yyyy-MM-dd HH:mm:ss)
 * @param {string} type - 中文时间段类型
 * @param {number} days - 自定义天数（用于最近 N 天）
 * @returns {Object} { startTime, endTime } 格式为 yyyy-MM-dd HH:mm:ss
 *
 * @example
 * const { startTime, endTime } = getTimeRangeByTypeFormat('本周');
 */
export function getTimeRangeByTypeFormat (type = '', days = 0) {
  const { startTime, endTime } = getTimeRangeByType(type, days);
  return {
    startTime: formatDateTime(startTime),
    endTime: formatDateTime(endTime)
  };
}

/**
 * 格式化时间戳为 yyyy-MM-dd HH:mm:ss
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export function formatDateTime (timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
