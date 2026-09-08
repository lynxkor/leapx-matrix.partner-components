import CryptoJS from 'crypto-js';

const key = CryptoJS.enc.Hex.parse('d86d7bab3d6ac01ad9dc6a897652f2d2');// Hex编码格式的密钥
const schema = {
  mode: CryptoJS.mode.ECB,
  padding: CryptoJS.pad.Pkcs7
};

/**
 * 过滤参数
 * @export
 * @param {*} params
 * @returns
 */
export function paramsFilter (params) {
  const obj = {};
  for (var key in params) {
    if (params[key] || params[key] === null) {
      obj[key] = params[key];
    } else if (params[key] === 0) {
      obj[key] = params[key];
    };
  };
  return obj;
};

/**
 * 解密
 * @export
 * @param {*} word
 * @returns
 */
export function decrypt (word) {
  let decryptd = CryptoJS.AES.decrypt(word, key, schema);// 解密
  try {
    return JSON.parse(CryptoJS.enc.Utf8.stringify(decryptd).toString());
  } catch (e) {
    return null;
  }
}
