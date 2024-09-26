import { isObject } from "@vue/share";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constants";

export function reactive(target) {
  return createReactiveObject(target);
}

// 缓存已经响应式的对象,避免重复浪费性能
const reactiveMap = new WeakMap();

function createReactiveObject(target) {
  // 判断是否为对象,不是对象直接返回
  if (!isObject(target)) {
    return;
  }
  // 如果是响应式数据直接返回即可
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 如果以处理过直接返回
  const exitsProxy = reactiveMap.get(target);
  if (exitsProxy) return exitsProxy;

  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

/**
 * value是对象则转换为reactive，否则返回
 * @param value
 * @returns
 */
export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
