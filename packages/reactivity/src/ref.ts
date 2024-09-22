import { activeEffect, trackEffect, triggerEffect } from "./effect";
import { toReactive } from "./reactive";
import { creatDep } from "./reactiveEffect";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public _v_isRef = true; // 是否时ref的标识
  public dep; // 收集effect依赖
  public _value;
  constructor(public rawValue) {
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
}

function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = creatDep(() => {
        ref.dep = undefined;
      }, "undefined"))
    );
  }
}

function triggerRefValue(ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffect(dep); // 触发依赖更新
  }
}
/**
 * 使reactive中的属性变为ref
 * 不丢时响应式
 * @param object
 * @param key
 * @returns
 */
export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

export function toRefs(object) {
  const res = {};
  for (let key of object) {
    res[key] = toRef(object, key);
  }
  return res;
}

class ObjectRefImpl {
  _v_isRef = true; // ref标识
  constructor(public _object, public _key) {}
  get value() {
    return this._object[this._key];
  }
  set value(value) {
    this._object[this._key] = value;
  }
}

export function proxyRefs(object) {
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
    },
  });
}
