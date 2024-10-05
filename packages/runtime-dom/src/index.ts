export * from "@vue/reactivity";
export * from "@vue/runtime-core";
import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";

const renderOptions = Object.assign(nodeOps, { patchProp });

// render方法采用domapi来进行渲染
export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};
