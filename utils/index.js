/* 比较两个对象是否相等 */
export function shallowEqual (obj1, obj2) {
  // 处理基本类型的比较
  if (obj1 === obj2) {
    return true;
  }

  // 处理null和undefined
  // eslint-disable-next-line eqeqeq
  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  // 确保两个都是对象
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  // 检查Symbol属性
  const symbols1 = Object.getOwnPropertySymbols(obj1);
  const symbols2 = Object.getOwnPropertySymbols(obj2);

  if (symbols1.length !== symbols2.length) {
    return false;
  }

  // 检查所有字符串键
  for (let key of keys1) {
    // eslint-disable-next-line no-prototype-builtins
    if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }

  // 检查所有Symbol键
  for (let symbol of symbols1) {
    // eslint-disable-next-line no-prototype-builtins
    if (!obj2.hasOwnProperty(symbol) || obj1[symbol] !== obj2[symbol]) {
      return false;
    }
  }

  return true;
}

/**
 * 下载excel文件
 * @param {string} fileUrl - 文件地址
 * @param {string} fileName - 文件名
 */
export function downloadExcel (fileUrl, fileName) {
  return new Promise((resolve, reject) => {
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const now = new Date(); // 暂时注释未使用到这个方法
        const timestamp = [
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        ].map(num => String(num).padStart(2, '0')).join('');
        // fileName = fileName + timestamp + '.xlsx' || fileName + timestamp + '.xls'; // 文件名添加时间戳
        // 检查文件名是否以 .xlsx 或 .xls 结尾（不区分大小写）
        const hasXlsxExtension = /\.xlsx$/i.test(fileName);

        if (hasXlsxExtension) { // 使用这个方法只支持.xlsx 和后端统一
          const nameWithoutExt = fileName.slice(0, -5);
          fileName = nameWithoutExt + timestamp + '.xlsx';
        } else {
          fileName = fileName + timestamp + '.xlsx';
        }
        // if (!hasExcelExtension) { // 目前只支持.xlsx文件 暂注释 其他扩展名
        //   // 如果没有Excel扩展名，添加 .xlsx
        //   fileName = fileName + timestamp + '.xlsx';
        // } else {
        //   // 如果已有Excel扩展名，只添加时间戳
        //   // 将时间戳插入到扩展名之前
        //   const lastDotIndex = fileName.lastIndexOf('.');
        //   const nameWithoutExt = fileName.substring(0, lastDotIndex);
        //   const extension = fileName.substring(lastDotIndex);
        //   fileName = nameWithoutExt + timestamp + extension;
        // }
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        resolve({ success: true, fileName });
      })
      .catch(error => {
        console.error('下载失败:', error);
        reject(error);
      });
  });
}

/**
 * 批量启用/禁用通用方法
 * @param {Array} selectionList - 选中的列表
 * @param {Boolean} targetStatus - 目标状态
 * @param {Function} apiFunc - API调用函数
 * @param {Function} refreshFunc - 刷新数据的函数
 * @param {Object} options - 配置选项
 */
export function handleBatchStatusChange ({
  selectionList,
  targetStatus, // 1表示启用，0表示停用
  apiFunc,
  refreshFunc,
  options = {}
}) {
  const {
    successMessage = '操作成功!',
    errorMessage = '操作失败!',
    confirmTitle = '',
    statusName = 'status',
    requireInput = true,
    showClose = false,
    statusMapping = { 1: '启用', 0: '停用' } // 调整映射关系
  } = options;

  // 使用状态映射获取文本
  const statusText = statusMapping[targetStatus] || (targetStatus === 1 ? '启用' : '停用');

  // 检查是否有选中的数据
  if (!selectionList || selectionList.length === 0) {
    this.$message({
      type: 'warning',
      message: '请先选择要操作的数据!'
    });
    return Promise.reject(new Error('未选择数据'));
  }

  // 检查所有选中项的状态是否都与要操作的目标状态不同
  // 如果目标状态是1(启用)，那么所有项当前必须是0(停用)
  // 如果目标状态是0(停用)，那么所有项当前必须是1(启用)
  const isAllCanOperate = selectionList.every(item => {
    const currentStatus = item[statusName];
    // 如果当前状态和目标状态相同，说明已经是要操作的状态，不能操作
    return currentStatus !== targetStatus;
  });

  if (!isAllCanOperate) {
    // 找出当前状态与目标状态相同的项
    const sameStatusItems = selectionList.filter(item => item[statusName] === targetStatus);

    this.$message({
      type: 'warning',
      message: sameStatusItems.length === selectionList.length
        ? `选中的数据已经是${statusText}状态，无需重复操作！`
        : `选中的数据中存在${statusText}状态的数据，无法批量${statusText}！`
    });
    // return Promise.reject(new Error('状态不满足操作条件'));
  }

  const ids = selectionList.map(item => item.id) || [];

  return new Promise((resolve, reject) => {
    const promptConfig = {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      title: confirmTitle,
      showClose: showClose,
      customClass: 'ais-enable-tips',
      message: `此操作将${statusText}选中项，是否继续?`
    };

    if (requireInput) {
      promptConfig.inputPlaceholder = `请输入${statusText}说明`;
    }

    this.$prompt(promptConfig.message, promptConfig).then(({ value }) => {
      // 校验输入内容长度
      if (value && value.length > 100) {
        this.$message({
          type: 'error',
          message: `${statusText}说明不能超过100字!`
        });
        return reject(new Error(`${statusText}说明不能超过100字`));
      }

      // 停用操作(targetStatus为0)需要说明，启用操作(targetStatus为1)可以没有说明
      if (!value && targetStatus === 0) { // targetStatus为0表示停用操作
        this.$message({
          type: 'error',
          message: `${statusText}说明不能为空!`
        });
        return reject(new Error(`${statusText}说明不能为空`));
      }

      const params = {
        idSet: ids,
        status: targetStatus, // 直接传1或0
        ...(value && { statusDesc: value }) // 如果有说明则添加
      };

      apiFunc(params)
        .then(() => {
          this.$message({
            type: 'success',
            message: successMessage
          });
          refreshFunc && refreshFunc();
          resolve();
        })
        .catch((error) => {
          this.$message({
            type: 'error',
            message: errorMessage
          });
          reject(error);
        });
    }).catch((err) => {
      console.log(err);
      // reject(new Error('用户取消操作'));
    });
  });
}

/**
 * 获取一天的最后时刻
 * @param {string} dateStr 时间
 * @returns {string} 时间 xx-xx-xx 23:59:59
 */
export function getEndOfDayString (dateStr) {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 通用接口调用与数据格式化
 * @param {Object} context Vue组件实例
 * @param {Function} apiFunc 接口函数
 * @param {Object} params 请求参数
 * @param {string} targetField 存储结果的目标字段
 * @param {Object} mapping 数据映射规则，默认为 { label: 'name', value: 'id' }
 */
export async function fetchAndFormatData (context, apiFunc, params, targetField, mapping = {}) {
  const defaultMapping = { label: 'name', value: 'id' }; // 默认映射规则
  const finalMapping = { ...defaultMapping, ...mapping }; // 合并默认值和自定义值

  try {
    const res = await apiFunc(params);
    if (res && Array.isArray(res)) {
      context[targetField] = res.map(item => ({
        ...item,
        label: item[finalMapping.label],
        value: item[finalMapping.value]
      }));
    }
  } catch (error) {
    console.error(`Failed to fetch data for ${targetField}:`, error);
    context.$message.error(`加载${targetField}数据失败，请稍后重试！`);
  }
}

// 防抖函数防止多次提交
export function debounce (fn, wait = 300) {
  let timer;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    let _this = this;
    timer = setTimeout(function () {
      fn.apply(_this, args);
    }, wait);
  };
}

// 简单审批流程提示框
/**
 * 批量审计操作的通用方法
 * @param {Array} selectionList - 当前选中的记录列表
 * @param {Function} messageError - 提示错误信息的方法 (如 this.$message.error)
 * @param {Function} confirm - 确认框方法 (如 this.$confirm)
 * @param {Object} options - 配置项
 * @param {number} options.expectedStatus - 期望的 auditStatus 值
 * @param {string} options.errorMessage - 不符合期望状态时的错误提示
 * @param {string} options.confirmMessage - 确认框的提示信息
 * @param {Function} refreshFunc - 刷新数据的函数
 */
export function batchAuditHandler (selectionList, messageError, confirm, options) {
  const { expectedStatus, errorMessage, confirmMessage, refreshFunc } = options;
  console.log('selectionList:', selectionList);
  // 检查是否有选中数据
  if (selectionList.length === 0) {
    messageError('请选择数据提交');
    return;
  }
  // 检查是否符合期望的状态
  if (selectionList.some(item => item.auditStatus !== expectedStatus)) {
    messageError(errorMessage);
    return;
  }
  // 弹出确认框
  confirm(confirmMessage).then(() => {
    // 确认后的逻辑可以在这里扩展
    refreshFunc && refreshFunc();
  }).catch(() => {
    // 用户取消操作
    refreshFunc && refreshFunc();
  });
}

/**
 * 时间格式化
 * @export
 * @param {*} val
 * @param {*} type 日期类型，data：年月日，datatime：年月日时分秒, time:时分秒
 * @returns
 */
export function formatDateTime (val, type) {
  var date = '';
  if (val) {
    date = new Date(val);
  } else {
    date = new Date();
  };
  var Y = date.getFullYear();
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return type === 'data' ? Y + '-' + M + '-' + D : type === 'time' ? h + ':' + m + ':' + s : Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
};

/**
 * 获取dom宽度 （不受缩放影响）
 */
export function getDomStyle (dom) {
  if (!dom) {
    return {};
  }
  const style = window.getComputedStyle(dom);
  const width = parseFloat(style.width);
  const marginLeft = parseFloat(style.marginLeft);
  const marginRight = parseFloat(style.marginRight);
  const marginBottom = parseFloat(style.marginBottom);
  const marginTop = parseFloat(style.marginTop);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingRight = parseFloat(style.paddingRight);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);
  const minWidth = parseFloat(style.minWidth);

  return {
    width,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    minWidth,
  };
}

/**
 * 获取元素的 CSS zoom 属性值
 * 注意：zoom 不是标准属性，获取方式特殊
 */
export function getElementZoomValue (element = document.body) {
  if (!element) return 1;

  // 方法1：通过 computedStyle 获取
  const style = window.getComputedStyle(element);

  // zoom 可能以字符串形式存在，如 "0.8", "80%", "normal"
  let zoomValue = style.zoom;

  if (!zoomValue || zoomValue === 'normal') {
    return 1;
  }

  // 处理百分比值
  if (zoomValue.endsWith('%')) {
    return parseFloat(zoomValue) / 100;
  }

  // 处理数字值
  const numericValue = parseFloat(zoomValue);
  return isNaN(numericValue) ? 1 : numericValue;
}

export const appPrefix = process.env.VUE_APP_ROUTER_BASE;
const prefixRegex = new RegExp(`^${appPrefix}`);
export const getRouterPath = () => {
  return location.pathname.replace(prefixRegex, '');
};
