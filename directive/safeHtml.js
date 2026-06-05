import Vue from 'vue';
import DOMPurify from 'dompurify';

/*
 * 富文本过滤
 * @modifiers
 *  v-safe-html="value" — 标准消毒，保留富文本格式
 *  v-safe-html.nl2br="value" — 先把 \n 转为 <br>，再消毒渲染（适合纯文本含换行的场景）
 *  v-safe-html.strict="value" — 剥离所有标签，只保留纯文本
*/
const defaultConfig = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'span', 'div', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr', 'blockquote', 'pre', 'code', 'sub', 'sup'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class', 'src', 'alt', 'title', 'width', 'height'],
  ALLOW_DATA_ATTR: false
};

const sanitize = (el, binding) => {
  let value = binding.value ?? '';
  if (binding.modifiers.nl2br) {
    value = value.replace(/\n/g, '<br>');
  }
  const config = binding.modifiers.strict ? {} : defaultConfig;
  el.innerHTML = DOMPurify.sanitize(value, config);
};

Vue.directive('safe-html', {
  bind: sanitize,
  update (el, binding) {
    if (binding.value !== binding.oldValue) {
      sanitize(el, binding);
    }
  }
});
