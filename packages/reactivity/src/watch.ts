import { isFunction, isObject } from "@vue/share";
import { ReactiveEffect } from "./effect";
import { isRef } from "./ref";
import { isReactive } from "./reactive";

export interface WatchOptions {
  immediate?: boolean;
  deep?: boolean;
  flush?: "sync" | "pre" | "post";
}

const resolvedPromise = Promise.resolve();

export function traverse(value, seen = new Set<any>()) {
  if (!isObject(value) || seen.has(value)) return value;
  seen.add(value);
  for (const key in value) traverse(value[key], seen);
  return value;
}

function createScheduler(job, flush) {
  return flush === "sync" ? job : () => resolvedPromise.then(job);
}

export function watch(source, callback, options: WatchOptions = {}) {
  let getter;
  if (isRef(source)) getter = () => source.value;
  else if (isReactive(source)) getter = () => traverse(source);
  else if (isFunction(source)) getter = source;
  else getter = () => source;

  if (options.deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  let cleanup;
  const onCleanup = (fn) => (cleanup = fn);
  let oldValue;
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

export function watchEffect(source, options: WatchOptions = {}) {
  let cleanup;
  const onCleanup = (fn) => (cleanup = fn);
  const getter = () => {
    cleanup?.();
    source(onCleanup);
  };
  let effect: ReactiveEffect;
  const job = () => effect.run();
  effect = new ReactiveEffect(getter, createScheduler(job, options.flush));
  effect.run();
  return () => {
    cleanup?.();
    effect.stop();
  };
}
