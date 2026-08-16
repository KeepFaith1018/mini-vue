import { isObject } from "@vue/share";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from "./baseHandler";
import { ReactiveFlags } from "./constants";

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers, reactiveMap);
}

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();

function createReactiveObject(target, isReadonly, handlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  if (
    (!isReadonly && target[ReactiveFlags.IS_REACTIVE]) ||
    (isReadonly && target[ReactiveFlags.IS_READONLY])
  ) {
    return target;
  }
  const exitsProxy = proxyMap.get(target);
  if (exitsProxy) return exitsProxy;

  const proxy = new Proxy(target, handlers);
  proxyMap.set(target, proxy);
  return proxy;
}

export function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowReactiveMap
  );
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyMap);
}

export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyMap
  );
}

export const isReactive = (value) => !!value?.[ReactiveFlags.IS_REACTIVE];
export const isReadonly = (value) => !!value?.[ReactiveFlags.IS_READONLY];
export const isProxy = (value) => isReactive(value) || isReadonly(value);
export const toRaw = (value) => value?.[ReactiveFlags.RAW] || value;

/**
 * value是对象则转换为reactive，否则返回
 * @param value
 * @returns
 */
export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
