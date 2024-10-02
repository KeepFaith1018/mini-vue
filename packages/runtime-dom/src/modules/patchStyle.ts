export function patchStyle(el: HTMLElement, preValue, nextValue) {
  let style = el.style;
  // 新样式生效
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  // 旧样式冗余删除
  if (preValue) {
    for (let key in preValue) {
      if (nextValue[key] == null) {
        style[key] = null;
      }
    }
  }
}
