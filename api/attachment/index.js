// api/attachment.js
import axios from 'axios';
import { Message } from 'element-ui';
import store from '@/store';

// 获取文件服务的baseURL，使用环境变量
const fileServiceBaseURL = process.env.VUE_APP_FILE_SERVICE_URL || 'https://aisfile-sit.leapmotor.com';

console.log('process.env.VUE_APP_FILE_SERVICE_URL:', process.env.VUE_APP_FILE_SERVICE_URL);

// 创建专门用于文件服务的axios实例
const fileServiceAxios = axios.create({
  baseURL: fileServiceBaseURL,
  timeout: 30000,
  headers: {
    Accepte: 'application/vnd.leapx.v2+json'
  }
});

// 文件服务请求拦截器
fileServiceAxios.interceptors.request.use(config => {
  if (store.state.user.token) {
    config.headers.Authorization = 'Bearer ' + store.state.user.token;
    // config.headers['X-CROSS-NODE-ID'] = localStorage.getItem('token');
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 文件服务响应拦截器
fileServiceAxios.interceptors.response.use(res => {
  const response = res.data;

  // 登陆token过期
  if (response.code === 610) {
    store.commit('USER_SIGN_OUT');
    return Promise.reject(response);
  } else if (/^20[0-9]+$/.test(response.code)) {
    // 正常返回
    return response;
  } else if (response.code === 600) {
    // 无数据
    return Promise.reject(response);
  } else {
    if (res.config.responseType === 'blob' && !response.code) {
      // 如果是文件流 直接返回
      return Promise.resolve({ data: response });
    }
    Message({
      message: response.msg,
      type: 'error',
      duration: 3000
    });
    return Promise.reject(response);
  }
}, error => {
  const response = error.response;

  if (response && response.status === 401) {
    store.commit('USER_SIGN_OUT');
    return Promise.reject(response.data);
  } else if (response && (response.status === 403 || response.status === 405)) {
    Message({
      message: response.data.msg,
      type: 'error',
      duration: 5000
    });
    return Promise.reject(response.data);
  } else if ((response && response.status === 400) || (response && response.status === 500) || (response && response.status === 710)) {
    if (response.data.msg) {
      Message({
        message: response.data.msg,
        type: 'error',
        duration: 5000
      });
    } else {
      Message({
        message: '服务器错误，请稍后再试',
        type: 'error',
        duration: 3000
      });
    }
    return Promise.reject(response.data);
  }

  Message({
    message: '服务器错误，请稍后再试',
    type: 'error',
    duration: 3000
  });
  return Promise.reject(error);
});

/**
 * 上传文件 - 使用文件服务专用域名
 * @export
 * @param {Object} params 上传参数
 * @returns
 */
export function uploadFile (params) {
  // 使用文件服务axios实例，直接POST表单数据
  return fileServiceAxios.post('/fileService/uploadMultipartFile', params, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 删除文件
 * @export
 * @param {Object} params
 * @returns
 */
export function deleteFile (params) {
  return fileServiceAxios.post('/web/attachment/attachment/delete', params, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * 获取附件列表
 * @export
 * @param {Object} params {businessId, attachType}
 * @returns
 */
export function getFileList (params) {
  return fileServiceAxios.post('/web/attachment/attachment/list', params);
}

/**
 * 文件绑定到业务id
 * @export
 * @param {Object} params
 * @returns
 */
export function addOrUpdateFile (params) {
  return fileServiceAxios.post('/web/attachment/attachment/addOrUpdate', params);
}

/**
 * 通过code查询上传附件配置详情信息
 * @export
 * @param {Object} params
 * @returns
 */
export function getByCode (params) {
  return fileServiceAxios.post('/web/attachment/attachmentConfig/getByCode', params, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
