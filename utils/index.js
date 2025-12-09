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
 * 下载文件公共方法
 * @param {string} url 文件下载地址
 * @param {string} fileName 文件名
 * @returns {boolean} 是否成功触发下载
 */
export function downloadFile (url, fileName = '文件') {
  if (!url) {
    console.error('下载地址不能为空');
    return false;
  }

  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    link.rel = 'noopener noreferrer'; // 安全优化

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`文件下载已触发: ${fileName}`);
    return true;
  } catch (error) {
    console.error('下载失败:', error);
    return false;
  }
}

/**
 * 下载Excel文件（专用方法）
 * @param {Object|string} rowOrUrl 行数据对象或文件URL
 * @param {string} defaultName 默认文件名
 */
export function downloadExcel (rowOrUrl, defaultName = '模板') {
  let url, fileName;

  if (typeof rowOrUrl === 'string') {
    url = rowOrUrl;
    fileName = defaultName;
  } else {
    url = rowOrUrl.excelModelUrl;
    fileName = rowOrUrl.fileName || rowOrUrl.businessType || defaultName;
  }

  // 确保文件有扩展名
  if (!fileName.includes('.')) {
    fileName += '.xlsx';
  }

  return downloadFile(url, fileName);
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
    confirmTitle = '提示',
    statusName = 'status',
    requireInput = true,
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
      type: 'warning',
      title: confirmTitle,
      message: `此操作将${statusText}选中项，是否继续?`
    };

    if (requireInput) {
      promptConfig.inputPlaceholder = `请输入${statusText}说明`;
    }

    this.$prompt(promptConfig.message, promptConfig).then(({ value }) => {
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
    }).catch(() => {
      reject(new Error('用户取消操作'));
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
export function debounce (fn, wait = 500) {
  var timeout;
  return function () {
    var that = this;
    var args = arguments;
    if (timeout) {
      clearTimeout(timeout);
    }
    var callNow = !timeout;
    timeout = setTimeout(() => {
      timeout = null;
    }, wait);
    if (callNow) fn.apply(that, args);
  };
}
