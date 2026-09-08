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
    // errorMessage = '操作失败!',
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
    return Promise.reject(new Error('状态不满足操作条件'));
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
          // this.$message({
          //   type: 'error',
          //   message: error.msg
          // });
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

export const appPrefix = window.APP_AIS_WEB_CONFIG?.VUE_APP_ROUTER_BASE || process.env.VUE_APP_ROUTER_BASE;
const prefixRegex = new RegExp(`^${appPrefix}`);
export const getRouterPath = () => {
  return location.pathname.replace(prefixRegex, '');
};

// 通用配置 对应导出表格 方法
export function generateTitleMap (columns) {
  if (!Array.isArray(columns)) return {};

  return columns.reduce((acc, col) => {
    if (col.field) {
      acc[col.field] = col.title;
    }
    return acc;
  }, {});
};

/**
 * 通用表格导出处理函数
 * @param {Object} options - 配置项
 * @param {String} apiFunc - 导出接口
 * @param {Function} download - 导出下载方法
 * @param {Function} message - 消息提示函数 (如 Element UI 的 ElMessage)
 * @param {Function} options.exportApiParamsFn - 生成导出参数的函数 (返回 Promise 或 对象)
 * @param {String} options.fileName - 导出的文件名 (不含后缀)
 * @param {Object} options.titleMap - 表头映射对象 { field: title }
 * @param {String} options.dataFetchPath - 后端数据获取路径
 * @param {String} options.businessType - 业务类型标识
 * @param {String} options.httpMethod - 请求方法，默认 'POST'
 * @param {Function} options.onStart - 开始回调 (通常用于开启 loading)
 * @param {Function} options.onEnd - 结束回调 (通常用于关闭 loading)
 */
export async function handleCommonExport (options) {
  const {
    apiFunc,
    download,
    message,
    exportApiParamsFn,
    fileName,
    titleMap,
    dataFetchPath,
    businessType,
    httpMethod = 'POST',
    onStart,
    onEnd
  } = options;

  // 1. 执行开始回调 (开启 loading)
  if (typeof onStart === 'function') {
    onStart();
  }

  try {
    // 2. 获取参数 (支持异步获取，比如需要先算出某些值)
    const reqParams = typeof exportApiParamsFn === 'function'
      ? await exportApiParamsFn()
      : exportApiParamsFn;

    // 3. 调用导出接口
    const res = await apiFunc({
      businessType,
      dataFetchPath,
      reqParams,
      titleMap,
      httpMethod
    });

    // 4. 处理结果
    if (res && res.excelUrl) {
      try {
        await download(res.excelUrl, `${fileName}.xlsx`);
        // 可选：下载成功提示
        // ElMessage.success('导出成功');
      } catch (downloadError) {
        console.error(downloadError);
        message({ type: 'error', message: '文件下载失败，请稍后重试' });
      }
    } else {
      // 后端返回了但没有 url，通常是异步生成
      message({ type: 'info', message: '任务已提交，请前往“导出中心”查询结果' });
    }
  } catch (error) {
    message({ type: 'error', message: '导出请求失败' });
  } finally {
    // 5. 执行结束回调 (关闭 loading)
    if (typeof onEnd === 'function') {
      onEnd();
    }
  }
}

/**
 * 通用操作处理函数
 * @param {Object} params - 参数对象
 * @param {Function} params.$confirm - Vue 实例中的 this.$confirm 方法
 * @param {Function} params.$message - Vue 实例中的 this.$message 方法
 * @param {Function} params.apiFn - 需要执行的 API 函数
 * @param {Object} params.config - 配置对象 { title, success }
 * @param {String|Number} params.id - 业务ID
 * @param {Function} [params.onSuccess] - 成功后的额外回调（可选）
 */
export function handleCommonAction ({
  $confirm,
  $message,
  apiFn,
  config,
  id,
  onSuccess,
  onComplete
}) {
  const message = `<div class="ais-leave-tips-main"><i class="iconfont icon-lxppc-prompt"></i>${config.title}</div>`;

  return $confirm(message, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    dangerouslyUseHTMLString: true,
    customClass: 'ais-leave-tips',
    showClose: false
  }).then(() => {
    // 调用 API
    return apiFn({ id });
  }).then(() => {
    // 提示成功
    $message.success(config.success);
    // 执行额外回调（比如刷新列表）
    if (onSuccess) onSuccess();
  }).catch((err) => {
    // 错误处理
    if (err !== 'cancel') {
      console.error('操作失败:', err);
    }
  }).finally(() => {
    // 无论成功还是失败都执行
    if (onComplete) onComplete();
  });
}

/**
 * 通用带输入的弹窗处理函数
 * @param {Object} params - 参数对象
 * @param {Function} params.$prompt - Vue 实例中的 this.$prompt 方法
 * @param {Function} params.$message - Vue 实例中的 this.$message 方法
 * @param {Function} params.apiFn - 需要执行的 API 函数
 * @param {Object} params.config - 配置对象 { title, placeholder, success }
 * @param {String|Number} params.id - 业务ID
 * @param {Number} [params.maxLength=100] - 最大字数限制，默认100
 * @param {Function} [params.onSuccess] - 成功后的额外回调（可选）
 */
export function handleCommonPrompt ({
  $prompt,
  $message,
  apiFn,
  config,
  id,
  maxLength = 100, // 🔥 关键点：设置默认值为 100
  onSuccess,
  onComplete
}) {
  return $prompt(config.placeholder, config.title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /.+/, // 校验非空
    inputErrorMessage: '请输入备注',
  }).then(({ value }) => {
    // 2. 二次校验：防止通过特殊手段绕过前端限制或处理粘贴超长文本的情况
    if (!value || value.length > maxLength) {
      $message.warning(`请输入不超过 ${maxLength} 字的${config.title}`);
      return Promise.reject(new Error('中断链条')); //  中断链条
    }
    // 调用 API，并传入用户输入的备注
    return apiFn({ id, description: value });
  }).then(() => {
    // 提示成功
    $message.success(config.success);
    // 执行额外回调（比如刷新列表）
    if (onSuccess) onSuccess();
  }).catch(() => {
    // 用户取消或校验失败，静默处理
  }).finally(() => {
    // 无论成功还是失败都执行
    if (onComplete) onComplete();
  });
}

/**
 * 数字输入框格式化
 * @param {string|number} value - 输入框的当前值
 * @param {object} options - 配置项
 * @param {number} [options.integerDigits=12] - 整数部分最大位数
 * @param {number} [options.decimalDigits=2] - 小数部分最大位数
 * @param {boolean} [options.allowDecimal=true] - 是否允许小数
 * @returns {string} - 格式化后的字符串
 */
export function formatNumberInput (value, options = {}) {
  const {
    integerDigits = 12, // 默认整数位 12
    decimalDigits = 2, // 默认小数位 2
    allowDecimal = true // 默认允许小数
  } = options;

  // 1. 转为字符串
  let val = String(value);

  // 2. 核心清洗：只保留数字和小数点（如果允许小数）
  if (allowDecimal) {
    val = val.replace(/[^\d.]/g, '');
  } else {
    val = val.replace(/[^\d]/g, '');
  }

  // 3. 确保只有一个小数点 (防止出现 1.2.3)
  if (allowDecimal) {
    const firstDotIndex = val.indexOf('.');
    if (firstDotIndex !== -1) {
      // 重新拼接：第一个小数点前的内容 + 小数点 + 第一个小数点后的内容(且去掉里面剩余的小数点)
      const beforeDot = val.substring(0, firstDotIndex);
      const afterDot = val.substring(firstDotIndex + 1).replace(/\./g, '');
      val = beforeDot + '.' + afterDot;
    }
  }

  // 4. 分割处理
  const parts = val.split('.');
  let integerPart = parts[0]; // 整数部分
  let decimalPart = parts[1] || ''; // 小数部分

  // 5. 限制整数部分最多 12 位
  if (integerPart.length > integerDigits) {
    integerPart = integerPart.slice(0, integerDigits);
  }

  // 6. 限制小数部分最多 2 位（如果允许小数）
  if (allowDecimal && decimalPart.length > decimalDigits) {
    decimalPart = decimalPart.slice(0, decimalDigits);
  }

  // 7. 重新组装并赋值
  // 如果有小数点且允许小数，拼接回原样
  if (allowDecimal && val.includes('.')) {
    val = integerPart + '.' + decimalPart;
  } else {
    val = integerPart;
  }
  return val;
}

/**
 * 将数字格式化为财务千分位字符串（默认 1,234,567.89）
 * @param {string|number|null|undefined} value - 待格式化的数值
 * @param {Object} [options] - 配置项
 * @param {number} [options.decimalDigits=2] - 保留的小数位数
 * @param {boolean} [options.padZero=true] - 小数位数不足时是否补 0；false 时去掉末尾的 0
 * @returns {string} 格式化后的字符串，空值/非数字返回 ''
 */
export function formatAmount (value, options = {}) {
  const {
    decimalDigits = 2,
    padZero = true
  } = options;

  // 空值与非数字直接返回空字符串
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const num = Number(value);
  if (isNaN(num)) {
    return '';
  }

  const sign = num < 0 ? '-' : '';
  const absStr = Math.abs(num).toFixed(decimalDigits); // 保证统一的小数位数
  const [intPart, decPart] = absStr.split('.');
  const intWithComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!padZero) {
    // 去掉小数部分末尾的 0，若全为 0 则省略小数部分
    const trimmedDec = decPart.replace(/0+$/, '');
    return trimmedDec ? `${sign}${intWithComma}.${trimmedDec}` : `${sign}${intWithComma}`;
  }

  return `${sign}${intWithComma}.${decPart}`;
}

/**
 * 通用导出确认弹窗1
 * 封装 Element UI 的 $confirm，提供统一的「导出任务异步处理」确认交互。
 * 推荐在调用时通过 prototype 注入的形式 this.$confirmExport 调用，函数内部通过 this.$confirm 访问弹窗。
 *
 * @param {Function} [callback] - 确认后执行的回调（可选，当前未在批量改造中使用，作为预留接口）
 * @param {Object} [options] - 配置项
 * @param {string} [options.message='是否确认导出？'] - 弹窗正文
 * @param {string} [options.title='提示'] - 弹窗标题
 * @param {string} [options.type='warning'] - 弹窗类型
 * @param {string} [options.confirmButtonText='确定'] - 确认按钮文字
 * @param {string} [options.cancelButtonText='取消'] - 取消按钮文字
 * @param {boolean} [options.skipConfirm=false] - 是否跳过确认直接执行 callback
 * @returns {Promise} Element UI $confirm 的 Promise
 */
export async function confirmExport (callback, options = {}) {
  const {
    message = '是否确认导出？',
    title = '提示',
    type = 'warning',
    confirmButtonText = '确定',
    cancelButtonText = '取消',
    skipConfirm = false
  } = options;

  if (skipConfirm) {
    return typeof callback === 'function' ? callback() : undefined;
  }
  return this.$confirm(message, title, {
    confirmButtonText,
    cancelButtonText,
    type
  }).then(() => {
    return typeof callback === 'function' ? callback() : undefined;
  }).catch(() => {});
}

/**
 * 通用附件必填与数量上下限校验
 * 规则：required 优先 —— required=false 的附件跳过 minNum/maxNum 校验；
 *       只有 required=true 时才按 minNum/maxNum 做上下限判断。
 *
 * 设计：仅收集并返回错误信息，**不主动弹 toast**。是否提示、如何展示由调用方决定，
 *       这样既支持业务页面渲染错误列表（点击跳转定位），也支持按需弹 message。
 *
 * @param {Object} options
 * @param {Array}  options.attachmentList  附件配置列表，元素需含 { label, required, minNum, maxNum, attachType }
 * @param {Object} options.refs            Vue 实例的 this.$refs（用于读取每个附件子组件实例）
 * @param {string} [options.refNamePrefix] 组件 ref 名模板，默认 'attachment'，实际读取 ${prefix}${index}
 * @param {Object} [options.messages]      自定义提示文案，覆盖默认文案
 * @returns {{
 *   valid: boolean,
 *   errors: string[],            // 给用户看的文案列表
 *   details: Array<{             // 结构化错误，方便业务页面渲染/跳转
 *     index: number,             // 附件在 attachmentList 中的下标
 *     refName: string,           // 组件 ref 名
 *     attachType: string,
 *     label: string,
 *     type: 'requiredEmpty' | 'minNum' | 'maxNum',
 *     fileLength: number,
 *     required: boolean,
 *     minNum: number,
 *     maxNum: number,
 *     message: string
 *   }>
 * }}
 */
export function validateAttachments ({
  attachmentList,
  refs,
  refNamePrefix = 'attachment',
  messages = {}
}) {
  const textTemplates = {
    requiredEmpty: label => `【${label}】为必填附件，请上传`,
    minNum: (label, n) => `【${label}】至少上传 ${n} 个附件`,
    maxNum: (label, n) => `【${label}】最多上传 ${n} 个附件`
  };
  const msgs = { ...textTemplates, ...messages };

  const errors = [];
  const details = [];

  (attachmentList || []).forEach((item, index) => {
    const refName = `${refNamePrefix}${index}`;
    const fileLength = refs?.[refName]?.[0]?.getFileList?.()?.length || 0;
    const { label, required, minNum = 0, maxNum = 0, attachType } = item;
    if (!required) return; // 非必填附件不参与数量上下限校验

    let type = null;
    let message = '';
    if (fileLength < 1) {
      type = 'requiredEmpty';
      message = msgs.requiredEmpty(label);
    } else if (minNum > 0 && fileLength < minNum) {
      type = 'minNum';
      message = msgs.minNum(label, minNum);
    } else if (maxNum > 0 && fileLength > maxNum) {
      type = 'maxNum';
      message = msgs.maxNum(label, maxNum);
    }
    if (type) {
      errors.push(message);
      details.push({ index, refName, attachType, label, type, fileLength, required, minNum, maxNum, message });
    }
  });

  return { valid: errors.length === 0, errors, details };
}
