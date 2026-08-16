import { activeEffect, trackEffect, triggerEffect } from "./effect";
import { toReactive } from "./reactive";
import { creatDep, type Dep } from "./reactiveEffect";

/**
 * 【接口建模】Ref 的"契约"。TS 是结构化类型:不看名字看形状 ——
 * RefImpl、ComputedRefImpl 都没有 implements 它,但形状符合就能当 Ref 用
 */
export interface Ref<T = unknown> {
  value: T;
  /** 【品牌标记】字面量类型 true,让普通对象在类型层面无法冒充 ref */
  _v_isRef: true;
  dep?: Dep;
}

export function ref<T>(value: T): Ref<T> {
  return createRef(value);
}

function createRef<T>(value: T): Ref<T> {
  return new RefImpl(value);
}

class RefImpl<T> {
  // 【as const】把 true 固化成字面量类型 true(否则被推导成 boolean,对不上接口)
  public _v_isRef = true as const; // 是否是ref的标识
  public dep?: Dep; // 收集effect依赖
  public _value: T;
  constructor(public rawValue: T) {
    this._value = toReactive(rawValue);
  }
  get value(): T {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue: T) {
    if (!Object.is(this.rawValue, newValue)) {
      this.rawValue = newValue;
      this._value = toReactive(newValue);
      triggerRefValue(this);
    }
  }
}

export function trackRefValue(ref: Ref) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep =
        ref.dep ||
        creatDep(() => {
          ref.dep = undefined;
        }, "undefined"))
    );
  }
}

export function triggerRefValue(ref: Ref) {
  let dep = ref.dep;
  if (dep) {
    triggerEffect(dep); // 触发依赖更新
  }
}
/**
 * 使reactive中的属性变为ref
 * 不丢失响应式
 * @param object
 * @param key
 * @returns
 */
// 【索引访问类型】T[K]:从对象类型 T 中"取出" key K 的类型
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): Ref<T[K]> {
  return new ObjectRefImpl(object, key);
}

// 【映射类型】对 T 的每个 key 逐个加工 —— Vue 的 ToRefs 就是这样
export type ToRefs<T extends object> = {
  [K in keyof T]: Ref<T[K]>;
};

export function toRefs<T extends object>(object: T): ToRefs<T> {
  const res = (Array.isArray(object) ? new Array(object.length) : {}) as ToRefs<
    T
  >;
  for (const key in object) {
    const k = key as keyof T & string;
    res[k] = toRef(object, k);
  }
  return res;
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  _v_isRef = true as const; // ref标识
  constructor(public _object: T, public _key: K) {}
  get value(): T[K] {
    return this._object[this._key];
  }
  set value(value: T[K]) {
    this._object[this._key] = value;
  }
}

// 【条件类型 + infer】T[K] 如果是 Ref<V> 就解包出 V,否则保持原样
// infer V = "这个位置的类型请 TS 自己推断"。Vue 里的 ShallowUnwrap 同款
export type UnwrapRefs<T> = {
  [K in keyof T]: T[K] extends Ref<infer V> ? V : T[K];
};

/**
 * 自动解包ref，不用通过.value访问
 */
export function proxyRefs<T extends object>(object: T): UnwrapRefs<T> {
  return new Proxy(object, {
    get(target, key, receiver) {
      let res = Reflect.get(target, key, receiver);
      return isRef(res) ? res.value : res;
    },
    set(target, key, value, receiver) {
      // Reflect.get 和 target[key] 行为一致,但类型更完整
      const oldValue = Reflect.get(target, key);
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  }) as UnwrapRefs<T>;
}

// 【类型守卫】返回 "value is Ref":调用处 if (isRef(x)) 里 x 自动变成 Ref
export const isRef = (value: unknown): value is Ref =>
  !!(value as { _v_isRef?: boolean })?._v_isRef;

// 【函数重载】传给调用者的两个签名:传 Ref<T> 拿到 T;传普通值原样拿回
export function unref<T>(value: Ref<T>): T;
export function unref<T>(value: T): T;
export function unref(value: unknown): unknown {
  return isRef(value) ? value.value : value;
}
