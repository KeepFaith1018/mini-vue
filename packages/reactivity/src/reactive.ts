import { isObject } from "@vue/share";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from "./baseHandler";
import { ReactiveFlags } from "./constants";

/**
 * 【泛型 + 约束】T extends object 限定只能传对象;
 * 返回值也是 T —— 传进来的是什么类型,拿回去还是什么类型,属性访问全程有提示
 */
export function reactive<T extends object>(target: T): T {
  return createReactiveObject(target, false, mutableHandlers, reactiveMap);
}

// 缓存表:同一个对象只代理一次(WeakMap 的 key 必须是对象)
const reactiveMap = new WeakMap<object, unknown>();
const readonlyMap = new WeakMap<object, unknown>();
const shallowReactiveMap = new WeakMap<object, unknown>();
const shallowReadonlyMap = new WeakMap<object, unknown>();

function createReactiveObject<T extends object>(
  target: T,
  isReadonly: boolean,
  // 注意这里用 ProxyHandler<object> 而不是 ProxyHandler<T>:
  // 若写 T,TS 会从 handlers 实参反向推断泛型,把 T 推断成 object
  handlers: ProxyHandler<object>,
  proxyMap: WeakMap<object, unknown>
): T {
  if (!isObject(target)) {
    return target;
  }
  const flags = target as FlagsHolder;
  if (
    (!isReadonly && flags[ReactiveFlags.IS_REACTIVE]) ||
    (isReadonly && flags[ReactiveFlags.IS_READONLY])
  ) {
    return target;
  }
  const exitsProxy = proxyMap.get(target);
  if (exitsProxy) return exitsProxy as T;

  // 显式指定泛型 <T>,防止 TS 又从 handlers 把类型推断回 object
  const proxy = new Proxy<T>(target, handlers);
  proxyMap.set(target, proxy);
  return proxy;
}

export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowReactiveMap
  );
}

// 【内置工具类型】Readonly<T>:把 T 的所有属性在类型层面变成只读
export function readonly<T extends object>(target: T): Readonly<T> {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers,
    readonlyMap
  ) as Readonly<T>;
}

export function shallowReadonly<T extends object>(target: T): Readonly<T> {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyMap
  ) as Readonly<T>;
}

/** 可能携带响应式标记的对象,用来按枚举 key 做类型安全的索引 */
type FlagsHolder = Partial<Record<ReactiveFlags, unknown>>;

export const isReactive = (value: unknown): value is object =>
  !!(value as FlagsHolder)?.[ReactiveFlags.IS_REACTIVE];
export const isReadonly = (value: unknown): value is object =>
  !!(value as FlagsHolder)?.[ReactiveFlags.IS_READONLY];
export const isProxy = (value: unknown): boolean =>
  isReactive(value) || isReadonly(value);
export const toRaw = <T>(value: T): T =>
  ((value as FlagsHolder)?.[ReactiveFlags.RAW] as T) || value;

/**
 * value是对象则转换为reactive，否则返回
 * @param value
 * @returns
 */
export function toReactive<T>(value: T): T {
  return isObject(value) ? reactive(value) : value;
}
