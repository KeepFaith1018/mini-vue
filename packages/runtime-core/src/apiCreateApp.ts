import { createVnode } from "./createVnode";

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps = null) {
    let container = null;
    const context = { provides: Object.create(null) };
    return {
      _component: rootComponent,
      _context: context,
      mount(rootContainer) {
        const vnode = createVnode(rootComponent, rootProps);
        vnode.appContext = context;
        render(vnode, rootContainer);
        container = rootContainer;
        return vnode.component?.proxy;
      },
      unmount() {
        if (container) render(null, container);
      },
      provide(key, value) {
        context.provides[key] = value;
        return this;
      },
    };
  };
}
