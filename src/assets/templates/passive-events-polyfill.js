// 为第三方库添加被动事件监听器支持
(function() {
  // 保存原始的 addEventListener
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  // 需要设置为被动的事件类型
  const passiveEvents = ['touchstart', 'touchmove', 'mousewheel', 'wheel'];
  
  // 重写 addEventListener
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // 如果是需要被动处理的事件类型
    if (passiveEvents.includes(type)) {
      // 如果 options 是布尔值，转换为对象
      if (typeof options === 'boolean') {
        options = { capture: options, passive: true };
      } 
      // 如果 options 是对象但没有设置 passive
      else if (typeof options === 'object' && options !== null) {
        if (!('passive' in options)) {
          options.passive = true;
        }
      } 
      // 如果没有提供 options
      else {
        options = { passive: true };
      }
    }
    
    // 调用原始方法
    return originalAddEventListener.call(this, type, listener, options);
  };
})();
