import { isFunction, isObject } from "@vue/share";
import { ReactiveEffect } from "./effect";
import { isRef, type Ref } from "./ref";
import { isReactive } from "./reactive";

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
  flush?: "sync" | "pre" | "post";
}

/** watch 支持的数据源:ref / reactive对象 / getter函数 / 普通值 */
export type WatchSource<T = unknown> = Ref<T> | object | (() => T) | T;

const resolvedPromise = Promise.resolve();

export function traverse<T>(value: T, seen: Set<object> = new Set()): T {
  if (!isObject(value) || seen.has(value)) return value;
  seen.add(value);
  for (const key in value) traverse(value[key], seen);
  return value;
}

// 【索引访问类型】WatchOptions["flush"]:直接从已有类型里"取出"成员的类型,避免重复书写
function createScheduler(
  job: () => void,
  flush: WatchOptions["flush"]
): () => void {
  return flush === "sync" ? job : () => resolvedPromise.then(job);
}

export function watch<T>(
  source: WatchSource<T>,
  callback: (
    newValue: T,
    oldValue: T | undefined,
    onCleanup: (fn: () => void) => void
  ) => void,
  options: WatchOptions = {}
): () => void {
  let getter: () => T;
  if (isRef(source)) getter = () => (source as Ref<T>).value;
  else if (isReactive(source)) getter = () => traverse(source) as T;
  else if (isFunction(source)) getter = source as () => T;
  else getter = () => source;

  if (options.deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  // 可变变量显式标注联合类型,否则 TS 会按第一次赋值"锁死"类型
  let cleanup: (() => void) | undefined;
  const onCleanup = (fn: () => void) => (cleanup = fn);
  let oldValue: T | undefined;
  const job = () => {
    const newValue = effect.run();
    if (options.deep || !Object.is(newValue, oldValue)) {
      cleanup?.();
      callback(newValue, oldValue, onCleanup);
      oldValue = newValue;
    }
  };
  const effect = new ReactiveEffect(
    getter,
    createScheduler(job, options.flush)
  );

  if (options.immediate) job();
  else oldValue = effect.run();

  return () => {
    cleanup?.();
    effect.stop();
  };
}

export function watchEffect(
  source: (onCleanup: (fn: () => void) => void) => void,
  options: WatchOptions = {}
): () => void {
  let cleanup: (() => void) | undefined;
  const onCleanup = (fn: () => void) => (cleanup = fn);
  const getter = () => {
    cleanup?.();
    source(onCleanup);
  };
  let effect: ReactiveEffect<void>;
  const job = () => effect.run();
  effect = new ReactiveEffect(getter, createScheduler(job, options.flush));
  effect.run();
  return () => {
    cleanup?.();
    effect.stop();
  };
}
