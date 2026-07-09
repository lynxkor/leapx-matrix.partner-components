/**
 * 复制文本到系统剪贴板
 * @param {string} text - 需要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export function copyText (text) {
  const value = text === null || text === undefined ? '' : String(text);
  if (!value) return Promise.resolve(false);

  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(value).then(() => true).catch(() => fallbackCopy(value));
  }
  return fallbackCopy(value);
}

/**
 * 兜底复制方案：临时 textarea + document.execCommand('copy')
 * @param {string} value
 * @returns {Promise<boolean>}
 */
function fallbackCopy (value) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve(ok);
  } catch (e) {
    return Promise.resolve(false);
  }
}
