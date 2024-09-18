// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
var activeEffect;
var ReactiveEffect = class {
  // fn 用户编写的函数
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    // 默认开启响应式
    this.active = true;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = void 0;
    }
  }
};
function trackEffect2(activeEffect2, dep) {
}

// packages/share/src/index.ts
function isObject(object) {
  return Object.prototype.toString.call(object) === "[object Object]";
}

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
    console.log(targetMap);
  }
}

// packages/reactivity/src/baseHandler.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if (key == "__v_isReactive" /* IS_REACTIVE */) return true;
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
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
export {
  activeEffect,
  effect,
  reactive,
  trackEffect2 as trackEffect
};
//# sourceMappingURL=reactivity.js.map
