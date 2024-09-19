// packages/reactivity/src/effect.ts
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
var activeEffect;
function preCleanEffect(effect2) {
  effect2._depslength = 0;
  effect2._trackId++;
}
var ReactiveEffect = class {
  // fn 用户编写的函数
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    // 记录当前effect执行了多少次
    this._depslength = 0;
    this.deps = [];
    // 依赖的集合
    // 默认开启响应式
    this.active = true;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      activeEffect = this;
      preCleanEffect(this);
      return this.fn();
    } finally {
      activeEffect = void 0;
    }
  }
};
function trackEffect(effect2, dep) {
  if (dep.get(effect2) != effect2._trackId) {
    dep.set(effect2, effect2._trackId);
  }
  dep.set(effect2, effect2._trackId);
  effect2.deps[effect2._depslength++] = dep;
}
function triggerEffect(dep) {
  for (const effect2 of dep.keys()) {
    if (effect2.scheduler) {
      effect2.scheduler();
    }
  }
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
    track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    let reseult = Reflect.set(target, key, value, receiver);
    if (oldValue != value) {
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
export {
  activeEffect,
  effect,
  reactive,
  trackEffect,
  triggerEffect
};
//# sourceMappingURL=reactivity.js.map
