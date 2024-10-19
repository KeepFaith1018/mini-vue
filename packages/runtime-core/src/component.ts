import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, ShapeFlags } from "@vue/share";

/**
 * 创建组件实例
 * @param vnode
 * @returns
 */
export function createComponentInstance(vnode, parent) {
  const instance = {
    data: null, // 状态
    vnode: vnode, // 虚拟节点
    subTree: null, // 子树
    update: null, // 组件更新的函数
    isMounted: false, // 是否挂载
    // 使用propsOptions来区分，props和attrsprops必须用户先声明才能取值 props没有声明，attrs有所有属性，声明后，会从attrs中抽离出来放到props里
    props: {},
    attrs: {},
    slots: {}, // 插槽
    propsOptions: vnode.type.props, // 用户声明的组件的props
    component: null,
    proxy: null, // 代理对象，方便用户访问props，attrs，data
    setupState: {}, // setup返回函数还是对象
    exposed: null, // 暴露给外部的属性
    parent, // 父组件
    // 提供给子组件的属性
    provides: parent ? parent.provides : Object.create(null), // 没有原型
  };
  return instance;
}

const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
};

/**
 * 初始化属性
 * @param instance 组件的实例
 * @param rawProps 用户传入的属性
 */
const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const propsOptions = instance.propsOptions || {}; // 组件中定义的
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      // TODO: value string | number 校验
      if (key in propsOptions) {
        // TODO: 不需要使用深度响应式，组件不能修改props，应该用shallowReactive,
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
};

// 公开的属性,提供gettr供外部访问，策略模式
const publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots,
};

const handler = {
  get(target, key) {
    console.log("读取", key);

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
  },
  set(target, key, value) {
    console.log("设置", key, value);

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
export function setupComponent(instance) {
  const { vnode } = instance;

  // 赋值属性
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children);
  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  // TODO: data的处理优化（没使用ts）
  const { data = () => {}, render, setup } = vnode.type;

  // setup函数模式
  if (setup) {
    const setupContext = {
      slots: instance.slots,
      attrs: instance.attrs,
      expose(value) {
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
        const handler = instance.props[eventName];
        handler && handler(...payload);
      },
    };

    setCurrentInstance(instance);
    const setupResult = setup(instance.proxy, setupContext);
    console.log("setup end");
    unsetCurrentInstance();

    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupState = proxyRefs(setupResult);
    }
  }

  if (!isFunction(data)) {
    console.warn("data option must be a function");
  } else {
    // 赋值状态
    instance.data = reactive(data.call(instance.proxy));
  }

  if (!instance.render) {
    // setup优先，没有render，用自己的
    instance.render = render;
  }
}

export let currentInstance = null;

export const getCurrentInstance = () => currentInstance;
export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};
export const unsetCurrentInstance = () => {
  currentInstance = null;
};
