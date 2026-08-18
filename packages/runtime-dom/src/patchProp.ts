// 对属性的操作，class，style，event

import { patchAttr } from "./modules/patchAttr";
import { patchClass } from "./modules/patchClass";
import { patchEvent } from "./modules/patchEvent";
import { patchStyle } from "./modules/patchStyle";
import type { RendererElement } from "@vue/runtime-core";

/**
 * 处理属性，更新旧dom上的属性，为新值
 * @param el 真实dom
 * @param key 属性名 class style event
 * @param preValue old
 * @param nextValue new
 * @returns
 */
export default function patchProp(
  el: RendererElement,
  key: string,
  preValue: unknown,
  nextValue: unknown
) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    // 走到这里 preValue/nextValue 都是样式对象,按模块的契约断言
    return patchStyle(
      el,
      preValue as Record<string, unknown> | null,
      nextValue as Record<string, unknown>
    );
  } else if (/^on[^a-z]/.test(key)) {
    // 正则匹配事件，一般都是onClick这种
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}
