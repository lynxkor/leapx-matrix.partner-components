import axios from 'axios';
import qs from 'qs';
import { paramsFilter, decrypt } from '../utils/crypto';
import { Message } from 'element-ui';
import store from '@/store';

// 运行时网关配置，每次请求时惰性解析：宿主入口 setWebConfig 注入 > APP_AIS_WEB_CONFIG > process.env
// 其他应用的配置全局名不同，在其入口设置，如：
//   import api, { setWebConfig } from '@/libs/axios';
//   setWebConfig(window.APP_XX_WEB_CONFIG);
let webConfig = null;

export function setWebConfig (cfg) {
  webConfig = cfg;
}

function getConfigURL (key) {
  const cfg = webConfig || window.APP_AIS_WEB_CONFIG || window.APP_LXP_CONFIG || {};
  return cfg[key] || process.env[key] || '';
}

// 路由到 ais 后端的 URL 前缀列表，新增前缀只需在此添加一行
// 注意：/desensitize/ 与 /dbMetadata/ 已脱离 ais 后端，走 VUE_APP_WORK_ORDER_URL（零小跑 app-portal）
const AIS_PREFIXES = [
  '/vehstock/', '/maintain/', '/claimreturn/', '/datacenter/',
  '/sp/', '/sp-local/', '/data/', '/vr/', '/vw/', '/datareport/', '/file/'
];

function resolveBaseURL (url, sign) {
  if (sign) return getConfigURL('VUE_APP_LEAPX_URL');
  const target = url.startsWith('/') ? url : '/' + url;
  return AIS_PREFIXES.some(p => target.startsWith(p)) ? getConfigURL('VUE_APP_AIS_URL') : getConfigURL('VUE_APP_WORK_ORDER_URL');
}

// 私有实例：宿主可能保留自己的 axios 封装（拦截器注册在全局默认实例上），
// libs 使用独立实例，避免两套封装在同一全局实例上重复注册拦截器互相干扰
const instance = axios.create();

// 请求拦截器
instance.interceptors.request.use(config => {
  if (store.state.user.token) {
    config.headers.Authorization = 'Bearer ' + store.state.user.token;
    config.headers['X-CROSS-NODE-ID'] = localStorage.getItem('token');
  };
  config.headers.Accepte = 'application/vnd.leapx.v2+json';
  return config;
}, error => {
  return Promise.reject(error);
});

const NEED_DECRYPT = (target) => {
  let NEED_DECRYPT_API = [
    '/passport/users/loginEncrypt'
  ];
  return NEED_DECRYPT_API.some(el => (new RegExp(`^${el}[/]?[0-9A-Z]*$`).test(target)));
};

const responseInterceptors = (instance, forbidToast) => {
  return instance.interceptors.response.use(res => {
    /**
    * code为非200是抛错 可结合自己业务进行修改
    */
    // NEED_DECRYPT_LIST中接口返回参数解密
    const flag = NEED_DECRYPT(res.config.url);
    const response = flag ? decrypt(res.data) : res.data;
    // const response = res.data;
    // 登陆token过期
    if (response.code === 610) {
      // 如果是手机，则返回原生的登陆页面
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
      !forbidToast && Message({
        message: response.msg,
        type: 'error',
        duration: 3000
      });

      return Promise.reject(response);
    }
  },
  error => {
    const response = error.response;
    // Handle cases where gateway returns HTML (e.g. login page) instead of JSON,
    // causing SyntaxError: Unexpected token '<' during axios auto-parsing.
    // Must check BEFORE response existence — gateway may return 200 with HTML body,
    // in which case response exists but transformResponse still throws SyntaxError.
    if (error instanceof SyntaxError && error.message.includes('<')) {
      store.commit('USER_SIGN_OUT');
      Message({
        message: '登录已过期，请重新登录',
        type: 'error',
        duration: 3000
      });
      return Promise.reject(error);
    }
    if (!response) {
      return Promise.reject(error);
    }
    const flag = NEED_DECRYPT(error.config?.url);
    response.data = flag ? decrypt(response.data) : response.data;

    if (response.status === 401) {
      store.commit('USER_SIGN_OUT');
      return Promise.reject(response.data);
    } else if (response.status === 403 || response.status === 405) {
      !forbidToast && Message({
        message: response.data.msg,
        type: 'error',
        duration: 5000
      });
      return Promise.reject(response.data);
    } else if (response.status === 400 || response.status === 500 || response.status === 710) {
      if (response.data.msg) {
        !forbidToast && Message({
          message: response.data.msg,
          type: 'error',
          duration: 5000
        });
      } else {
        !forbidToast && Message({
          message: '服务器错误，请稍后再试',
          type: 'error',
          duration: 3000
        });
      }
      return Promise.reject(response.data);
    }

    !forbidToast && Message({
      message: '服务器错误，请稍后再试',
      type: 'error',
      duration: 3000
    });
    return Promise.reject(error);
  });
};
let myInterceptorsResponse = responseInterceptors(instance);

function buildRequestConfig (method, config, sign, url) {
  const contentTypeMap = {
    postJson: 'application/json',
    delete: config?.isJSON ? 'application/json' : 'application/x-www-form-urlencoded',
    put: config?.isRealPut ? 'application/json' : 'multipart/form-data'
  };
  const contentType = contentTypeMap[method] || 'application/x-www-form-urlencoded';
  return {
    baseURL: resolveBaseURL(url, sign),
    // 默认请求超时时间，防止慢接口或网关挂起时请求永久阻塞 UI；单个请求可在 config 中覆盖
    timeout: 60000,
    ...config,
    headers: { 'Content-Type': contentType, ...config?.headers }
  };
}

/**
 * @param {string} url 请求地址
 * @param {object} params 请求参数
 * @param {string} method 请求方法
 * @param {boolean} sign 是否是leapx接口
 * @param {boolean} userResponse 是否自定义拦截器
 * @param {object} config 自定义配置 {responseType: 'blob', isRealPut: true}
 */
export function fetch (url, params, method, sign, userResponse, config) {
  if (url === '/userCenter/user/v1/api/sso/getRedirectUrl') {
    console.log('单点跳转登录:/userCenter/user/v1/api/sso/getRedirectUrl');
    instance.defaults.withCredentials = true;
  };
  // 自定义拦截器
  if (userResponse) {
    instance.interceptors.response.eject(myInterceptorsResponse);
    myInterceptorsResponse = responseInterceptors(instance, userResponse);
  }

  const reqConfig = buildRequestConfig(method, config, sign, url);

  if (method === 'post') {
    return instance.post(url, qs.stringify(params), reqConfig).then(res => res.data);
  }
  if (method === 'postJson') {
    if (params?.id === '') delete params.id;
    return instance.post(url, params, reqConfig).then(res => res.data);
  }
  if (method === 'put') {
    if (config?.isRealPut) {
      return instance.put(url, params, reqConfig).then(res => res.data);
    }
    return instance.post(url, params, reqConfig).then(res => res.data);
  }
  if (method === 'get') {
    return instance.get(url, { ...reqConfig, params }).then(res => res.data);
  }
  if (method === 'delete') {
    return instance.delete(url, { ...reqConfig, params }).then(res => res.data);
  }
};

export default {
  // post方法
  post (url, params, sign, userResponse) {
    let temp = params;
    if (params) {
      temp = JSON.stringify(params);
      temp = JSON.parse(temp);
    };
    return fetch(url, paramsFilter(temp), 'post', sign, userResponse);
  },
  // postJSON方法
  jsonPost (url, params, sign, userResponse) {
    let temp = params;
    if (params) {
      temp = JSON.stringify(params);
      temp = JSON.parse(temp);
    };
    return fetch(url, temp, 'postJson', sign, userResponse);
  },
  // postJSON方法--文件流
  postExport (url, params, config) {
    return fetch(url, params, 'postJson', '', '', config);
  },

  // get方法
  get (url, params, sign, userResponse) {
    let temp = params;
    if (params) {
      temp = JSON.stringify(params);
      temp = JSON.parse(temp);
    };
    return fetch(url, paramsFilter(temp), 'get', sign, userResponse);
  },
  // delete方法
  delete (url, params, sign) {
    let temp = params;
    if (params) {
      temp = JSON.stringify(params);
      temp = JSON.parse(temp);
    };
    return fetch(url, temp, 'delete', sign);
  },
  // delete方法 -JSON
  deleteJson (url, params, sign) {
    let temp = params;
    // 注意传输 params= { data:xxx }
    return fetch(url, temp, 'delete', sign, '', { isJSON: true });
  },

  // put方法 - 实际是post请求
  putFormData (url, params, sign) {
    return fetch(url, params, 'put', sign);
  },
  put (url, params, sign) {
    return fetch(url, params, 'put', sign, '', { isRealPut: true });
  }
};
