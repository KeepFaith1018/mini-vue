import { createVnode, type VNode, type VNodeProps } from "./createVnode";
import type { AppContext, Component } from "./component";
import type { RendererElement } from "./renderer";

/** createApp 返回的应用实例 */
export interface App {
  _component: Component;
  _context: AppContext;
  mount: (rootContainer: RendererElement) => unknown; // 返回 vnode.component?.proxy
  unmount: () => void;
  provide: (key: string, value: unknown) => App; // 返回 this,支持链式调用
}

export function createAppAPI(
  render: (vnode: VNode | null, container: RendererElement) => void
) {
  return function createApp(
    rootComponent: Component,
    rootProps: VNodeProps | null = null
  ): App {
    let container: RendererElement | null = null;
    const context: AppContext = { provides: Object.create(null) };
    return {
      _component: rootComponent,
      _context: context,
      mount(rootContainer: RendererElement) {
        const vnode = createVnode(rootComponent, rootProps);
        vnode.appContext = context;
        render(vnode, rootContainer);
        container = rootContainer;
        return vnode.component?.proxy;
      },
      unmount() {
        if (container) render(null, container);
      },
      provide(key: string, value: unknown) {
        context.provides[key] = value;
        return this;
      },
    };
  };
}
