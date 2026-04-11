// 子应用路由前缀
const prefixes = ['/partner', '/marketing', '/serviceProduct', '/sales', '/service'].filter(item => item !== (window.APP_AIS_WEB_CONFIG?.VUE_APP_ROUTER_BASE || process.env.VUE_APP_ROUTER_BASE));

/**
 * 路由跳转
 * @param {Object|String} location 同 $router.push 参数
 * @param {Boolean} isBlank 是否需要强制新开窗口
 */
export default function navigate (location, isBlank, $router) {
  let path = '';
  let query = {};
  let params = {};

  if (typeof location === 'string') {
    path = location;
  } else if (location?.path) {
    path = location.path;
    query = location.query || {};
    params = location.params || {};
  } else if (location?.name && $router) {
    // 如果有 name 没有 path，尝试解析
    const resolved = $router.resolve(location);
    path = resolved.route.path || ''; // 获取路由配置的 path 模式
    query = resolved.route.query || {};
    params = resolved.route.params || {};

    // 目前不支持用name进行跨子应用跳转
    // window.__PARENT_ROUTER__.resolve(location);
  }

  const open = () => {
    // 构建完整的 URL，支持 query 参数
    let url = path;

    // 处理 query 参数
    if (query && Object.keys(query).length > 0) {
      const queryString = Object.keys(query)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
        .join('&');
      url += (url.includes('?') ? '&' : '?') + queryString;
    }

    // 处理 params（如果是动态路由，需要替换 path 中的参数）
    if (params && Object.keys(params).length > 0) {
      // 替换 path 中的动态参数，例如 /user/:id -> /user/123
      url = url.replace(/\/:(\w+)/g, (match, paramName) => {
        return params[paramName] ? `/${params[paramName]}` : match;
      });
    }

    window.open(url, '_blank');
  };

  if (isBlank) {
    open();
    return;
  }

  const matchedPrefix = prefixes.find(prefix => path.startsWith(prefix));
  // 子应用之间跳转
  if (matchedPrefix) {
    if (window.__POWERED_BY_QIANKUN__ && window.__PARENT_ROUTER__) {
      window.__PARENT_ROUTER__.push(location);
    } else {
      open();
    }
  } else {
    // 本地路由跳转
    $router.push(location);
  }
}
