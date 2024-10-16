// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var activeEffect;
function preCleanEffect(effect2) {
  effect2._depslength = 0;
  effect2._trackId++;
}
function postCleanEffect(effect2) {
  if (effect2.deps.length > effect2._depslength) {
    for (let i = effect2._depslength; i < effect2.deps.length; i++) {
      cleanEffect(effect2.deps[i], effect2);
    }
    effect2.deps.length = effect2._depslength;
  }
}
var ReactiveEffect = class {
  /**
   *
   * @param fn 用户创建的副作用函数，执行时会收集依赖，依赖变更会重新执行
   * @param scheduler 调度器，默认调用fn函数，也可以自定义处理逻辑
   */
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    // 记录当前effect执行了多少次
    this._depslength = 0;
    this._running = 0;
    this._dirtyLevel = 4 /* Dirty */;
    this.deps = [];
    // 依赖的集合
    // 默认开启响应式
    this.active = true;
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(v) {
    this._dirtyLevel = v ? 4 /* Dirty */ : 0 /* NoDirty */;
  }
  run() {
    this._dirtyLevel = 0 /* NoDirty */;
    if (!this.active) {
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      this._running++;
      preCleanEffect(this);
      return this.fn();
    } finally {
      this._running--;
      activeEffect = lastEffect;
      postCleanEffect(this);
    }
  }
};
function cleanEffect(dep, effect2) {
  dep.delete(effect2);
  if (dep.size == 0) {
    dep.cleanup();
  }
}
function trackEffect(effect2, dep) {
  if (dep.get(effect2) != effect2._trackId) {
    dep.set(effect2, effect2._trackId);
    let oldDep = effect2.deps[effect2._depslength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanEffect(oldDep, effect2);
      }
      effect2.deps[effect2._depslength++] = dep;
    } else {
      effect2._depslength++;
    }
  }
}
function triggerEffect(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2._dirtyLevel < 4 /* Dirty */) {
      effect2._dirtyLevel = 4 /* Dirty */;
    }
    if (effect2.scheduler) {
      if (!effect2.running) {
        effect2.scheduler();
      }
    }
  }
}

// packages/share/src/index.ts
function isObject(object) {
  return Object.prototype.toString.call(object) === "[object Object]";
}
function isFunction(fn) {
  return typeof fn === "function";
}
function isString(str) {
  return typeof str === "string";
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
var hasOwn = (value, key) => hasOwnProperty.call(value, key);

// packages/reactivity/src/reactiveEffect.ts
var creatDep = (cleanup, key) => {
  const dep = /* @__PURE__ */ new Map();
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = creatDep(() => depsMap.delete(key), key));
    }
    trackEffect(activeEffect, dep);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffect(dep);
  }
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key == "__v_isReactive" /* IS_REACTIVE */) return true;
    console.log("\u6536\u96C6\u4F9D\u8D56", target, key);
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    let reseult = Reflect.set(target, key, value, receiver);
    if (oldValue != value) {
      console.log("\u89E6\u53D1\u51FD\u6570", target, key, value, oldValue);
      trigger(target, key, value, oldValue);
    }
    return reseult;
  }
};

// packages/reactivity/src/reactive.ts
function reactive(target) {
  return createReactiveObject(target);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function createReactiveObject(target) {
  if (!isObject(target)) {
    return;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) return exitsProxy;
  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return createRef(value);
}
function createRef(value) {
  return new RefImpl(value);
}
var RefImpl = class {
  constructor(rawValue) {
    this.rawValue = rawValue;
    this._v_isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (this.rawValue !== newValue) {
      this.rawValue = newValue;
      this._value = newValue;
      triggerRefValue(this);
    }
  }
};
function trackRefValue(ref2) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      ref2.dep = ref2.dep || creatDep(() => {
        ref2.dep = void 0;
      }, "undefined")
    );
  }
}
function triggerRefValue(ref2) {
  let dep = ref2.dep;
  if (dep) {
    triggerEffect(dep);
  }
}
function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}
function toRefs(object) {
  const res = {};
  for (let key of object) {
    res[key] = toRef(object, key);
  }
  return res;
}
var ObjectRefImpl = class {
  // ref标识
  constructor(_object, _key) {
    this._object = _object;
    this._key = _key;
    this._v_isRef = true;
  }
  get value() {
    return this._object[this._key];
  }
  set value(value) {
    this._object[this._key] = value;
  }
};
function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver);
      return res._v_isRef ? res.value : res;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue._v_isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  });
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  // 与其他依赖于计算属性的值建立关联
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      // 用调度器触发更新渲染
      () => {
        triggerRefValue(this);
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
};
function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter, setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/runtime-core/src/createVnode.ts
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function isVnode(value) {
  return value?.__v_isVnode;
}
function createVnode(type, props, children) {
  const shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key,
    // 进行diff算法比较时的key
    el: null,
    // 虚拟节点对应的真实节点
    shapeFlag
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else if (isObject(children)) {
      vnode.shapeFlag |= 32 /* SLOTS_CHILDREN */;
    } else {
      children = String(children);
      vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
  }
  return vnode;
}

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      return createVnode(type, propsOrChildren, null);
    } else {
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}

// packages/runtime-core/src/seq.ts
function getSequence(arr) {
  const length = arr.length;
  const result = [0];
  const p = result.slice(0);
  let start, end, middle;
  for (let i = 0; i < length; i++) {
    let arrI = arr[i];
    if (arrI !== 0) {
      const lastIndex = result[result.length - 1];
      if (arrI > arr[lastIndex]) {
        p[i] = result[result.length - 1];
        result.push(i);
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = (start + end) / 2 | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1];
        result[start] = i;
      }
    }
  }
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last];
  }
  return result;
}

// packages/runtime-core/src/scheduler.ts
var queue = [];
var resolvePromise = Promise.resolve();
var isFlushing = false;
function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach((fn) => {
        fn();
      });
      copy.length = 0;
    });
  }
}

// packages/runtime-core/src/component.ts
function createComponentInstance(vnode) {
  const instance = {
    data: null,
    // 状态
    vnode,
    // 虚拟节点
    subTree: null,
    // 子树
    update: null,
    // 组件更新的函数
    isMounted: false,
    // 是否挂载
    // 使用propsOptions来区分，props和attrsprops必须用户先声明才能取值 props没有声明，attrs有所有属性，声明后，会从attrs中抽离出来放到props里
    props: {},
    attrs: {},
    slots: {},
    // 插槽
    propsOptions: vnode.type.props,
    // 用户声明的组件的props
    component: null,
    proxy: null,
    // 代理对象，方便用户访问props，attrs，data
    setupState: {},
    // setup返回函数还是对象
    exposed: null
    // 暴露给外部的属性
  };
  return instance;
}
var initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
};
var initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const propsOptions = instance.propsOptions || {};
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key];
      if (key in propsOptions) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  instance.props = reactive(props);
  instance.attrs = attrs;
};
var publicProperty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots
};
var handler = {
  get(target, key) {
    console.log("\u8BFB\u53D6", key);
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
    console.log("\u8BBE\u7F6E", key, value);
    const { data, props, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (hasOwn(props, key)) {
      console.warn("props are readonly");
      return false;
    } else if (hasOwn(setupState, key)) {
      setupState[key] = value;
    }
    return true;
  }
};
function setupComponent(instance) {
  const { vnode } = instance;
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children);
  instance.proxy = new Proxy(instance, handler);
  const { data = () => {
  }, render: render2, setup } = vnode.type;
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
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        const handler2 = instance.props[eventName];
        handler2 && handler2(...payload);
      }
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
    instance.data = reactive(data.call(instance.proxy));
  }
  if (!instance.render) {
    instance.render = render2;
  }
}
var currentInstance = null;
var getCurrentInstance = () => currentInstance;
var setCurrentInstance = (instance) => {
  currentInstance = instance;
};
var unsetCurrentInstance = () => {
  currentInstance = null;
};

// packages/runtime-core/src/apiLifeCycle.ts
var LifeCycle = /* @__PURE__ */ ((LifeCycle2) => {
  LifeCycle2["BEFORE_MOUNT"] = "bm";
  LifeCycle2["MOUNTED"] = "m";
  LifeCycle2["BEFORE_UPDATE"] = "bu";
  LifeCycle2["UPDATED"] = "u";
  LifeCycle2["BEFORE_UNMOUNT"] = "bum";
  LifeCycle2["UNMOUNTED"] = "um";
  return LifeCycle2;
})(LifeCycle || {});
function createHook(type) {
  return (hook, target = currentInstance) => {
    if (target) {
      let wrapHook = function() {
        setCurrentInstance(target);
        hook.call(target);
        unsetCurrentInstance();
      };
      const hooks = target[type] || (target[type] = []);
      hooks.push(wrapHook);
    }
  };
}
var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
var onMounted = createHook("m" /* MOUNTED */);
var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
var onUpdated = createHook("u" /* UPDATED */);
var onBeforeUnmount = createHook("bum" /* BEFORE_UNMOUNT */);
var onUnmounted = createHook("um" /* UNMOUNTED */);
function invokerArray(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
}

// packages/runtime-core/src/renderer.ts
function createRenderer(renderOptions2) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling
  } = renderOptions2;
  const mountElement = (vnode, container, anchor) => {
    const { type, children, props, shapeFlag } = vnode;
    let el = vnode.el = hostCreateElement(type);
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      if (typeof children[i] === "string") {
        children[i] = h("text", {}, children[i]);
      }
      patch(null, children[i], container);
    }
  };
  const processText = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      hostInsert(newVnode.el = hostCreateText(newVnode.children), container);
    } else {
      const el = newVnode.el = oldVnode.el;
      if (oldVnode.children !== newVnode.children) {
        hostSetText(el, newVnode.children);
      }
    }
  };
  const processFragment = (oldVnode, newVnode, container) => {
    if (oldVnode == null) {
      mountChildren(newVnode.children, container);
    } else {
      patchChildren(oldVnode, newVnode, container);
    }
  };
  const processElement = (oldVode, newVnode, container, anchor) => {
    if (oldVode == null) {
      mountElement(newVnode, container, anchor);
    } else {
      patchElement(oldVode, newVnode, container);
    }
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance, instance.props, next.props);
  };
  function setupRenderEffect(instance, container, anchor) {
    const { render: render3 } = instance;
    const componentUpdateFn = () => {
      const { bm, m } = instance;
      if (!instance.isMounted) {
        if (bm) {
          invokerArray(bm);
        }
        const subTree = render3.call(instance.proxy, instance.proxy);
        console.log("effect\u6302\u8F7D\u7EC4\u4EF6", instance);
        patch(null, subTree, container, anchor);
        instance.isMounted = true;
        instance.subTree = subTree;
        if (m) {
          invokerArray(m);
        }
      } else {
        const { next, bu, u } = instance;
        if (next) {
          console.log("\u5C5E\u6027\u548C\u63D2\u69FD\u66F4\u65B0", next);
          updateComponentPreRender(instance, next);
        }
        if (bu) {
          invokerArray(bu);
        }
        const subTree = render3.call(instance.proxy, instance.proxy);
        console.log("effect\u66F4\u65B0\u7EC4\u4EF6", subTree);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
        if (u) {
          invokerArray(u);
        }
      }
    };
    const effect2 = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(update)
    );
    console.log(effect2);
    const update = instance.update = () => effect2.run();
    update();
  }
  const mountComponent = (vnode, container, anchor) => {
    const instance = vnode.component = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
  };
  const hasPropsChange = (preProps, nextProps) => {
    let nKeys = Object.keys(nextProps);
    if (nKeys.length == Object.keys(preProps).length) {
      for (let i = 0; i < nKeys.length; i++) {
        const key = nKeys[i];
        if (nextProps[key] !== preProps[key]) {
          return true;
        }
      }
    }
    return false;
  };
  const updateProps = (instance, preProps, nextProps) => {
    if (hasPropsChange(preProps, nextProps)) {
      for (let key in nextProps) {
        instance.props[key] = nextProps[key];
      }
      for (let key in instance.props) {
        if (!(key in nextProps)) {
          delete instance.props[key];
        }
      }
    }
  };
  const shouldComponentUpdate = (oldVnode, newVnode) => {
    const { props: preProps, children: preChildren } = oldVnode;
    const { props: nextProps, children: nextChildren } = newVnode;
    if (preChildren || nextChildren) return true;
    return hasPropsChange(preProps, nextProps);
  };
  const updateComponent = (oldVnode, newVnode) => {
    const instance = newVnode.component = oldVnode.component;
    if (shouldComponentUpdate(oldVnode, newVnode)) {
      instance.next = newVnode;
      instance.update();
    }
  };
  const processComponent = (oldVnode, newVnode, container, anchor) => {
    if (oldVnode == null) {
      mountComponent(newVnode, container, anchor);
    } else {
      updateComponent(oldVnode, newVnode);
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  const patchKeyedChildren = (oldChildren, newChildren, el) => {
    let index = 0;
    let e1 = oldChildren.length - 1;
    let e2 = newChildren.length - 1;
    while (index <= e1 && index <= e2) {
      if (isSameVnode(oldChildren[index], newChildren[index])) {
        patch(oldChildren[index], newChildren[index], el);
      } else {
        break;
      }
      index++;
    }
    while (index <= e1 && index <= e2) {
      if (isSameVnode(oldChildren[e1], newChildren[e2])) {
        patch(oldChildren[e1], newChildren[e2], el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (index > e1) {
      if (index <= e2) {
        let nextPos = e2 + 1;
        let anchor = newChildren[nextPos]?.el;
        while (index <= e2) {
          patch(null, newChildren[index], el, anchor);
          index++;
        }
      }
    } else if (index > e2) {
      if (index <= e1) {
        while (index <= e1) {
          unmount(oldChildren[index]);
          index++;
        }
      }
    } else {
      let s1 = index;
      let s2 = index;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      let toBePatched = e2 - s2 + 1;
      let newIndexToOldMapIndex = new Array(toBePatched).fill(0);
      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(newChildren[i].key, i);
      }
      for (let i = s1; i <= e1; i++) {
        let oldChild = oldChildren[i];
        let newIndex = keyToNewIndexMap.get(oldChild.key);
        if (newIndex === void 0) {
          unmount(oldChild);
        } else {
          newIndexToOldMapIndex[newIndex - s2] = i + 1;
          patch(oldChild, newChildren[newIndex], el);
        }
      }
      let increasingSequence = getSequence(newIndexToOldMapIndex);
      let j = increasingSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        let newIndex = s2 + i;
        let anchor = newChildren[newIndex + 1]?.el;
        let vnode = newChildren[newIndex];
        if (!vnode.el) {
          patch(null, vnode, el, anchor);
        } else {
          if (j == i) {
            j--;
          } else {
            hostInsert(vnode.el, el, anchor);
          }
        }
      }
    }
  };
  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const patchChildren = (oldVNode, newVNode, el) => {
    let oldChildren = oldVNode.children;
    let newChildren = newVNode.children;
    let preShapeFlag = oldVNode.shapeFlag;
    let shapeFlag = newVNode.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(oldChildren);
      }
      if (oldChildren !== newChildren) {
        hostSetElementText(el, newChildren);
      }
    } else if (preShapeFlag & 16 /* ARRAY_CHILDREN */) {
      if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        patchKeyedChildren(oldChildren, newChildren, el);
      } else {
        unmountChildren(oldChildren);
      }
    } else {
      if (preShapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, "");
      }
      if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(newChildren, el);
      }
    }
  };
  const patchElement = (oldVNode, newVNode, container) => {
    let el = newVNode.el = oldVNode.el;
    let oldProps = oldVNode.props || {};
    let newProps = newVNode.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(oldVNode, newVNode, el);
  };
  const patch = (oldVnode, newVnode, container, anchor = null) => {
    if (oldVnode == newVnode) {
      return;
    }
    if (oldVnode && !isSameVnode(oldVnode, newVnode)) {
      unmount(oldVnode);
      oldVnode = null;
    }
    const { type, shapeFlag } = newVnode;
    switch (type) {
      case Text:
        processText(oldVnode, newVnode, container);
        break;
      case Fragment:
        processFragment(oldVnode, newVnode, container);
        break;
      default:
        if (shapeFlag & 1 /* ELEMENT */) {
          processElement(oldVnode, newVnode, container, anchor);
        } else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
          processComponent(oldVnode, newVnode, container, anchor);
        }
    }
  };
  const unmount = (vnode) => {
    if (vnode.type == Fragment) {
      unmountChildren(vnode.children);
    } else if (vnode.shapeFlag & 6 /* COMPONENT */) {
      unmount(vnode.component.subTree);
    } else {
      hostRemove(vnode.el);
    }
  };
  const render2 = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
      container._vnode = vnode;
    }
  };
  return {
    render: render2
  };
}

// packages/runtime-dom/src/nodeOps.ts
var nodeOps = {
  /**
   * 插入元素
   * @param el  真实节点
   * @param parent  父节点
   * @param anchor  插入的位置，没有则在末尾插入
   */
  insert(el, parent, anchor = null) {
    parent.insertBefore(el, anchor);
  },
  remove(el) {
    const parent = el.parentNode;
    if (parent) {
      parent.removeChild(el);
    }
  },
  createElement(type) {
    return document.createElement(type);
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setText(node, text) {
    return node.nodeValue = text;
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  parentNode(node) {
    return node.parentNode;
  },
  nextSibling(node) {
    return node.nextSibling;
  }
};

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value == null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value == null) {
    el.removeAttribute("class");
  } else {
    el.setAttribute("class", value);
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
function patchEvent(el, key, nextValue) {
  const invokers = el._vei || (el._vei = {});
  const eventName = key.slice(2).toLowerCase();
  const exisitingInvoker = invokers[key];
  if (nextValue && exisitingInvoker) {
    return exisitingInvoker.value = nextValue;
  }
  if (nextValue) {
    const invoker = invokers[key] = createInvoker(nextValue);
    el.addEventListener(eventName, invoker);
  }
  if (exisitingInvoker) {
    el.removeEventListener(eventName, exisitingInvoker);
    invokers[key] = void 0;
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, preValue, nextValue) {
  let style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key];
  }
  if (preValue) {
    for (let key in preValue) {
      if (!(key in nextValue)) {
        style[key] = null;
      }
    }
  }
}

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, preValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, preValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign(nodeOps, { patchProp });
var render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};
export {
  Fragment,
  LifeCycle,
  ReactiveEffect,
  Text,
  activeEffect,
  computed,
  createComponentInstance,
  createRenderer,
  createVnode,
  currentInstance,
  effect,
  getCurrentInstance,
  h,
  invokerArray,
  isSameVnode,
  isVnode,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  onUpdated,
  proxyRefs,
  reactive,
  ref,
  render,
  setCurrentInstance,
  setupComponent,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerEffect,
  triggerRefValue,
  unsetCurrentInstance
};
//# sourceMappingURL=runtime-dom.js.map
