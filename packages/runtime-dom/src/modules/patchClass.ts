import type { RendererElement } from "@vue/runtime-core";

export function patchClass(el: RendererElement, value: unknown) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.setAttribute("class", value);
  }
}
