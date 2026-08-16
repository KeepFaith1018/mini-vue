export * from "@vue/reactivity";
export * from "@vue/runtime-core";
export * from "./runtimeCompiler";
import "./runtimeCompiler";
import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";

const renderOptions = Object.assign(nodeOps, { patchProp });

const renderer = createRenderer(renderOptions);
export const render = renderer.render;
export const createApp = (rootComponent, rootProps = null) => {
  const app = renderer.createApp(rootComponent, rootProps);
  const mount = app.mount;
  app.mount = (container) => {
    const target =
      typeof container === "string" ? document.querySelector(container) : container;
    if (!target) throw new Error("Failed to mount app: container not found.");
    return mount(target);
  };
  return app;
};
