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
    fileName = rowOrUrl.fileName || defaultName;
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
  targetStatus,
  apiFunc,
  refreshFunc,
  options = {}
}) {
  const {
    successMessage = '操作成功!',
    errorMessage = '操作失败!',
    confirmTitle = '提示',
    statusName = 'status',
    requireInput = true
  } = options;

  const statusText = targetStatus ? '启用' : '停用';

  // 检查是否所有项的状态都相同
  const isDifferentStatus = this.selectionList.find(item => item.status === targetStatus);

  if (isDifferentStatus) {
    this.$message({
      type: 'warning',
      message: `存在不是${statusText}的数据，请确认!`
    });
    return Promise.reject(new Error('状态不一致'));
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
      if (!value && statusText === '停用') { // 做一个效验,为停用时一定要有说明,否则驳回,可用时,可没有说明
        this.$message({
          type: 'error',
          message: `${statusText}说明不能为空!`
        });
        return;
      };
      const params = {
        idSet: ids,
        status: targetStatus,
        statusDesc: value
        // ...(requireInput && value && { statusDesc: value })
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
