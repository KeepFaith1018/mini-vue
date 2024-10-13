import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/share";

/**
 * 创建组件实例
 * @param vnode
 * @returns
 */
export function createComponentInstance(vnode) {
  const instance = {
    data: null, // 状态
    vnode: vnode, // 虚拟节点
    subTree: null, // 子树
    update: null, // 组件更新的函数
    isMounted: false, // 是否挂载
    // 使用propsOptions来区分，props和attrs
    // props必须用户先声明才能取值
    // props没有声明，attrs有所有属性，声明后，会从attrs中抽离出来放到props里
    props: {},
    attrs: {},
    propsOptions: vnode.type.props, // 用户声明的组件的props
    component: null,
    proxy: null, // 代理对象，方便用户访问props，attrs，data
  };
  return instance;
}

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
};

const handler = {
  get(target, key) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const getter = publicProperty[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (hasOwn(props, key)) {
      // 用户可以修改嵌套属性内部的值，但是不合法
      // props定义后应该是只读的
      console.warn("props are readonly");
      return false;
    }
    return true;
  },
};
export function setupComponent(instance) {
  const { vnode } = instance;

  // 赋值属性
  initProps(instance, vnode.props);

  // 赋值代理对象
  instance.proxy = new Proxy(instance, handler);
  // TODO: data的处理优化（没使用ts）
  const { data = () => {}, render } = vnode.type;
  if (!isFunction(data)) {
    console.warn("data option must be a function");
  } else {
    // 赋值状态
    instance.data = reactive(data.call(instance.proxy));
  }
  instance.render = render;
}
