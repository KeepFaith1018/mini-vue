// 对属性的操作，class，style，event

import { patchAttr } from "./modules/patchAttr";
import { patchClass } from "./modules/patchClass";
import { patchEvent } from "./modules/patchEvent";
import { patchStyle } from "./modules/patchStyle";

// 属性比较复杂，需要进行diff

export default function patchProp(el: HTMLElement, key, preValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, preValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    // 正则匹配事件，一般都是onClick这种
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}
