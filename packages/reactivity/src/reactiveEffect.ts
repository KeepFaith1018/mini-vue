import {
  activeEffect,
  trackEffect,
  triggerEffect,
  type ReactiveEffect,
} from "./effect";

// vue3.4之前是用set,之后为了进行清理操作,改成了effect
// 用来创建 key和effect的依赖关系,并可以清理不需要的属性

/**
 * 【交叉类型】Dep = Map 本身 + 额外挂载的两个字段。
 * 之前是 new Map() as any 绕过类型;交叉类型让 Map 的完整类型保留下来
 */
export type Dep = Map<ReactiveEffect, number> & {
  cleanup: () => void;
  name: PropertyKey;
};

/**
 * 创建收集器 映射属性和副作用函数的容器
 * @param cleanup 清理函数，可以将这个属性对应的清除掉
 * @param key     属性名
 * @returns
 */
export const creatDep = (cleanup: () => void, key: PropertyKey): Dep => {
  // 这里的断言躲不掉:Map 字面量没法直接挂字段 —— 但断言目标是精确的 Dep,不是 any
  const dep = new Map<ReactiveEffect, number>() as Dep;
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};

// 容器也带泛型:声明好 key/value 类型,之后 get/set 全程有检查
const targetMap = new WeakMap<object, Map<PropertyKey, Dep>>();

export function track(target: object, key: PropertyKey) {
  // 有activeEffect这个属性,说明是在effect中访问的,不存在则不需要收集
  if (activeEffect) {
    // 映射obj => property
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    // 映射property => effect
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = creatDep(() => depsMap.delete(key), key)));
    }
    // 将effect和收集器关联起来
    trackEffect(activeEffect, dep);
  }
}

export function trigger(
  target: object,
  key: PropertyKey,
  _newValue?: unknown,
  _oldValue?: unknown
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    // 找不到对象，直接返回
    return;
  }
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffect(dep);
  }
}
