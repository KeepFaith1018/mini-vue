// 对属性的操作，class，style，event

import { patchAttr } from "./modules/patchAttr";
import { patchClass } from "./modules/patchClass";
import { patchEvent } from "./modules/patchEvent";
import { patchStyle } from "./modules/patchStyle";

/**
 * 处理属性
 * @param el 真实dom
 * @param key 属性名 class style event
 * @param preValue old
 * @param nextValue new
 * @returns
 */
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
