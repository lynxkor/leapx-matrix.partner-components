import Vue from 'vue';

/**
 * 防抖指令 v-debounce
 * 使用方式：
 * 1. v-debounce:click="handler" - 默认 300ms
 * 2. v-debounce:click.500="handler" - 自定义延迟时间
 * 3. v-debounce:input.500="handler" - 输入框防抖
 * 4. v-debounce:click.immediate="handler" - 立即执行一次，然后防抖
 */

// 创建防抖函数
const createDebounceFn = (fn, delay, immediate = false) => {
  let timer = null;
  let immediateCalled = false;

  return (...args) => {
    if (immediate && !immediateCalled) {
      fn(...args);
      immediateCalled = true;
      return;
    }

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
      timer = null;
      immediateCalled = false;
    }, delay);
  };
};

// 提取延迟时间
const extractDelay = (modifiers) => {
  let delay = 300;
  Object.keys(modifiers).forEach(key => {
    const time = parseInt(key);
    if (!isNaN(time) && time > 0) {
      delay = time;
    }
  });
  return delay;
};

// 绑定事件处理
const bindEventHandler = (el, binding) => {
  const eventType = binding.arg || 'click';
  const fn = binding.value;
  const { immediate, ...modifiers } = binding.modifiers;

  const delay = extractDelay(modifiers);
  const debouncedFn = createDebounceFn(fn, delay, immediate);

  // 保存引用以便后续清理
  el.__debounce__ = {
    handler: debouncedFn,
    eventType,
    originalFn: fn
  };

  el.addEventListener(eventType, debouncedFn);
};

// 解绑事件处理
const unbindEventHandler = (el) => {
  if (el.__debounce__) {
    const { handler, eventType } = el.__debounce__;
    el.removeEventListener(eventType, handler);
    delete el.__debounce__;
  }
};

Vue.directive('debounce', {
  bind: bindEventHandler,
  unbind: unbindEventHandler,

  update (el, binding) {
    const newFn = binding.value;
    const oldFn = binding.oldValue;

    if (newFn !== oldFn && el.__debounce__) {
      // 移除旧的事件监听
      unbindEventHandler(el);
      // 绑定新的事件监听
      bindEventHandler(el, binding);
    }
  }
});
