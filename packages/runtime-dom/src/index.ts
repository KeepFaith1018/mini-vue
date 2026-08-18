export * from "@vue/reactivity";
export * from "@vue/runtime-core";
export * from "./runtimeCompiler";
import "./runtimeCompiler";
import { createRenderer } from "@vue/runtime-core";
import type { Component, RendererElement, VNodeProps } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";

const renderOptions = Object.assign(nodeOps, { patchProp });

const renderer = createRenderer(renderOptions);
export const render = renderer.render;
export const createApp = (
  rootComponent: Component,
  rootProps: VNodeProps | null = null
) => {
  const app = renderer.createApp(rootComponent, rootProps);
  const mount = app.mount;
  // 包装 mount:支持传选择器字符串(real Vue 同款)
  app.mount = (container: RendererElement | string) => {
    const target =
      typeof container === "string" ? document.querySelector(container) : container;
    if (!target) throw new Error("Failed to mount app: container not found.");
    return mount(target);
  };
  return app;
};
