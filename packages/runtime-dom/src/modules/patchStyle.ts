import type { RendererElement } from "@vue/runtime-core";

export function patchStyle(
  el: RendererElement,
  preValue: Record<string, unknown> | null,
  nextValue: Record<string, unknown>
) {
  // 开放接口上取到 style,类型落在宿主侧的边界上
  let style = el.style;
  // 新样式生效
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  // 旧样式冗余删除
  if (preValue) {
    for (let key in preValue) {
      if (!(key in nextValue)) {
        style[key] = null;
      }
    }
  }
}
