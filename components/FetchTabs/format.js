/**
 * 替换模板中的变量占位符
 * @param {string} template - 包含${variable}格式占位符的模板字符串
 * @param {Object} variables - 变量键值对
 * @returns {string} 替换后的字符串
 */
export function interpolateTemplate (template, variables) {
  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * 从数据对象中提取值并填充到模板中
 * @param {Object} data - 数据源对象
 * @param {string} template - 模板字符串，如：${name}(${code})
 * @returns {string} 渲染后的字符串
 */
export function renderTemplate (data, template) {
  // 提取所有变量名
  const variableNames = [];
  template.replace(/\$\{([^}]+)\}/g, (match, name) => {
    variableNames.push(name);
    return match;
  });

  // 构建变量映射
  const variables = {};
  variableNames.forEach(key => {
    variables[key] = data[key];
  });

  return interpolateTemplate(template, variables);
}
