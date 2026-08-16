import { isObject } from "@vue/share";
import { track, trigger } from "./reactiveEffect";
import { reactive, readonly } from "./reactive";
import { ReactiveFlags } from "./constants";

// 【lib 自带类型】ProxyHandler 是 TS 内置的,别写 any。
// 返回值标注 ProxyHandler<object>["get"],内部函数参数自动获得类型,不用逐个标
function createGetter(
  isReadonly = false,
  shallow = false
): ProxyHandler<object>["get"] {
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

function createSetter(): ProxyHandler<object>["set"] {
  return function set(target, key, value, receiver) {
    // Reflect.get 与 target[key] 行为一致,但类型更完整
    const oldValue = Reflect.get(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (!Object.is(oldValue, value)) trigger(target, key, value, oldValue);
    return result;
  };
}

const readonlySetter: ProxyHandler<object>["set"] = (_target, key) => {
  console.warn(
    `Set operation on key "${String(key)}" failed: target is readonly.`
  );
  return true;
};

export const mutableHandlers: ProxyHandler<object> = {
  get: createGetter(),
  set: createSetter(),
};

export const shallowReactiveHandlers: ProxyHandler<object> = {
  get: createGetter(false, true),
  set: createSetter(),
};

export const readonlyHandlers: ProxyHandler<object> = {
  get: createGetter(true),
  set: readonlySetter,
};

export const shallowReadonlyHandlers: ProxyHandler<object> = {
  get: createGetter(true, true),
  set: readonlySetter,
};
