import type { RendererElement } from "@vue/runtime-core";

export function patchAttr(el: RendererElement, key: string, value: unknown) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    // 非空值交给 DOM 自动转字符串(与原始行为一致),类型上经开放接口透传
    el.setAttribute(key, value);
  }
}
