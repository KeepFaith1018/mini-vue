import {
  proxyRefs,
  reactive,
  shallowReactive,
  shallowReadonly,
  type ReactiveEffect,
} from "@vue/reactivity";
import { hasOwn, isFunction, ShapeFlags } from "@vue/share";
// 与 createVnode/renderer 互相引用类型 —— import type 编译后被擦除,不会产生运行时循环依赖
import type { RendererElement, RendererNode } from "./renderer";
import type { VNode, VNodeNormalizedChildren, VNodeProps } from "./createVnode";

/** 组件实例、状态等普通对象统一用 Data 表示(Vue 同款写法,值类型从 any 收紧为 unknown) */
export type Data = Record<string, unknown>;

/** setup 的第二个参数 */
export interface SetupContext {
  slots: Record<string, SlotFunction>;
  attrs: Data;
  expose: (value: Data) => void;
  emit: (event: string, ...payload: unknown[]) => void;
}

/** 插槽函数:调用后返回子节点 */
export type SlotFunction = (
  ...args: unknown[]
) => VNodeNormalizedChildren | VNode;

/** 渲染函数 */
export type RenderFunction = (ctx?: unknown, cache?: unknown) => VNode;

export interface ComponentOptions {
  props?: Record<string, unknown>; // 用户声明的组件 props
  data?: (this: unknown) => Data;
  render?: RenderFunction;
  setup?: (props: Data, ctx: SetupContext) => unknown;
  template?: string;
}

export type FunctionalComponent = (attrs: Data) => VNode;

export type Component = ComponentOptions | FunctionalComponent;

export interface AppContext {
  provides: Data;
}

/** 生命周期钩子函数 */
export type HookFn = () => void;

/**
 * KeepAlive 需要的渲染上下文,由 renderer 在挂载时注入。
 * 用 Partial 表示"注入后才完整",访问处配合 ! 断言
 */
export interface KeepAliveContext {
  render: {
    createElement: (tag: string) => RendererElement;
    move: (
      vnode: VNode,
      container: RendererElement,
      anchor: RendererNode | null
    ) => void;
    unmount: (vnode: VNode) => void;
  };
  activate: (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => void;
  deactivate: (vnode: VNode) => void;
}

/** 组件实例:挂载时创建,是渲染器的中枢对象 */
export interface ComponentInstance {
  data: Data | null; // 状态
  vnode: VNode; // 虚拟节点
  subTree: VNode | null; // 子树
  update: (() => void) | null; // 组件更新的函数
  isMounted: boolean; // 是否挂载
  props: Data; // 用户声明后从 attrs 抽离出的 props
  attrs: Data;
  slots: Record<string, SlotFunction>; // 插槽
  propsOptions: Record<string, unknown> | undefined; // 用户声明的组件的props
  component: ComponentInstance | null;
  proxy: unknown; // 代理对象，方便用户访问props，attrs，data（真实 Vue 会定义 ComponentPublicInstance，这里克制为 unknown）
  setupState: Data; // setup返回函数还是对象
  exposed: Data | null; // 暴露给外部的属性
  parent: ComponentInstance | null; // 父组件
  provides: Data; // 提供给子组件的属性
  ctx: Partial<KeepAliveContext>; // keepalive中缓存的dom
  effect: ReactiveEffect | null;
  appContext: AppContext | null;
  // 挂载流程中后续赋值的字段
  render?: RenderFunction;
  next: VNode | null;
  // 生命周期钩子,字段名与 LifeCycle 枚举一一对应,因此可以用 target[type] 索引
  bm?: HookFn[];
  m?: HookFn[];
  bu?: HookFn[];
  u?: HookFn[];
  bum?: HookFn[];
  um?: HookFn[];
}

/**
 * 创建组件实例
 * @param vnode
 * @returns
 */
export function createComponentInstance(
  vnode: VNode,
  parent: ComponentInstance | null
): ComponentInstance {
  const instance: ComponentInstance = {
    data: null, // 状态
    vnode: vnode, // 虚拟节点
    subTree: null, // 子树
    update: null, // 组件更新的函数
    isMounted: false, // 是否挂载
    // 使用propsOptions来区分，props和attrsprops必须用户先声明才能取值 props没有声明，attrs有所有属性，声明后，会从attrs中抽离出来放到props里
    props: {},
    attrs: {},
    slots: {}, // 插槽
    propsOptions: (vnode.type as ComponentOptions).props, // 组件 vnode 的 type 一定是组件选项,断言收窄
    component: null,
    proxy: null,
    setupState: {}, // setup返回函数还是对象
    exposed: null, // 暴露给外部的属性
    parent, // 父组件
    // 提供给子组件的属性
    provides: parent
      ? parent.provides
      : vnode.appContext?.provides || Object.create(null),
    ctx: {}, // keepalive中缓存的dom
    effect: null,
    appContext: vnode.appContext || parent?.appContext || null,
    next: null,
  };
  return instance;
}

const initSlots = (
  instance: ComponentInstance,
  children: VNodeNormalizedChildren
): void => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 插槽 children 实际是"插槽名 => 函数"的对象
    instance.slots = children as Record<string, SlotFunction>;
  } else {
    instance.slots = {};
  }
};

/**
 * 初始化属性
 * @param instance 组件的实例
 * @param rawProps 用户传入的属性
 */
const initProps = (
  instance: ComponentInstance,
  rawProps: VNodeProps | null
): void => {
  const props: Data = {};
  const attrs: Data = {};
  const propsOptions = instance.propsOptions || {}; // 组件中定义的
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      // TODO: value string | number 校验
      if (key in propsOptions || /^on[A-Z]/.test(key)) {
        // TODO: 不需要使用深度响应式，组件不能修改props，应该用shallowReactive,
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = shallowReactive(props);
  instance.attrs = attrs;
};

// 公开的属性,提供gettr供外部访问，策略模式
const publicProperty: Record<
  PropertyKey,
  (instance: ComponentInstance) => unknown
> = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
};

const handler: ProxyHandler<ComponentInstance> = {
  get(target, key) {
    // data/props/setupState 都按字符串索引,符号 key 与原逻辑一样返回 undefined
    if (typeof key === "symbol") return;
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    } else if (hasOwn(setupState, key)) {
      return setupState[key];
    }

    const getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
    // 无匹配字段,与原逻辑一致落到 undefined
    return undefined;
  },
  set(target, key, value) {
    // 符号 key 不会命中任何字段,与原逻辑一致直接放行
    if (typeof key === "symbol") return true;
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (hasOwn(props, key)) {
      // 用户可以修改嵌套属性内部的值，但是不合法
      // props定义后应该是只读的
      console.warn("props are readonly");
      return false;
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  },
};
export function setupComponent(instance: ComponentInstance): void {
  const { vnode } = instance;

  // 赋值属性
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  // TODO: data的处理优化（没使用ts）
  // 只有组件 vnode 才有这些选项,断言成 ComponentOptions(函数式组件解构出来全是 undefined,行为一致)
  const { data = () => {}, render, setup } = vnode.type as ComponentOptions;

  // setup函数模式
  if (setup) {
    const setupContext: SetupContext = {
      slots: instance.slots,
      attrs: instance.attrs,
      expose(value: Data) {
        instance.exposed = value;
      },
      /**
       * 触发事件
       * @param event 事件名
       * @param payload 参数
       */
      emit(event, ...payload) {
        // click =》 onClick
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        // 事件处理器就存在 props 里,取出来调用
        const handler = instance.props[eventName] as
          | ((...args: unknown[]) => void)
          | undefined;
        handler && handler(...payload);
      },
    };

    setCurrentInstance(instance);
    let setupResult: unknown;
    try {
      setupResult = setup(shallowReadonly(instance.props), setupContext);
    } finally {
      unsetCurrentInstance();
    }

    if (isFunction(setupResult)) {
      instance.render = setupResult as RenderFunction;
    } else {
      instance.setupState = proxyRefs((setupResult || {}) as Data);
    }
  }

  if (!isFunction(data)) {
    console.warn("data option must be a function");
  } else {
    // 赋值状态
    // 解构默认值 () => {} 让 TS 把 data 推断为返回 void,按组件选项的声明断言回 Data(运行时仍返回 undefined,行为不变)
    instance.data = reactive(data.call(instance.proxy) as unknown as Data);
  }

  if (!instance.render) {
    // setup优先，没有render，用自己的
    instance.render =
      render ||
      (compiler && (vnode.type as ComponentOptions).template
        ? (compiler(
            (vnode.type as ComponentOptions).template!
          ) as RenderFunction)
        : undefined);
  }
}

export let currentInstance: ComponentInstance | null = null;
let compiler: ((template: string) => unknown) | undefined;
export const registerRuntimeCompiler = (
  _compiler: (template: string) => unknown
) => {
  compiler = _compiler;
};

export const getCurrentInstance = () => currentInstance;
export const setCurrentInstance = (instance: ComponentInstance | null) => {
  currentInstance = instance;
};
export const unsetCurrentInstance = () => {
  currentInstance = null;
};
