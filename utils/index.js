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
