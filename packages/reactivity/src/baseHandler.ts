import { isObject } from "@vue/share";
import { track, trigger } from "./reactiveEffect";
import { reactive, readonly } from "./reactive";
import { ReactiveFlags } from "./constants";

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly;
    if (key === ReactiveFlags.IS_READONLY) return isReadonly;
    if (key === ReactiveFlags.RAW) return target;

    const result = Reflect.get(target, key, receiver);
    if (!isReadonly) track(target, key);
    if (shallow) return result;
    return isObject(result)
      ? isReadonly
        ? readonly(result)
        : reactive(result)
      : result;
  };
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (!Object.is(oldValue, value)) trigger(target, key, value, oldValue);
    return result;
  };
}

const readonlySetter = (target, key) => {
  console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`);
  return true;
};

export const mutableHandlers: ProxyHandler<any> = {
  get: createGetter(),
  set: createSetter(),
};

export const shallowReactiveHandlers: ProxyHandler<any> = {
  get: createGetter(false, true),
  set: createSetter(),
};

export const readonlyHandlers: ProxyHandler<any> = {
  get: createGetter(true),
  set: readonlySetter,
};

export const shallowReadonlyHandlers: ProxyHandler<any> = {
  get: createGetter(true, true),
  set: readonlySetter,
};
