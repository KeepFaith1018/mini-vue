import { isFunction } from "@vue/share";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue, type Ref } from "./ref";
import type { Dep } from "./reactiveEffect";

export type ComputedGetter<T> = (oldValue?: T) => T;
export type ComputedSetter<T> = (newValue: T) => void;
export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

class ComputedRefImpl<T> {
  public _v_isRef = true as const;
  public _value?: T;
  public effect: ReactiveEffect<T>; // 与依赖的值建立关联
  public dep?: Dep; // 与其他依赖于计算属性的值建立关联
  constructor(getter: ComputedGetter<T>, public setter: ComputedSetter<T>) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      // 用调度器触发更新渲染
      () => {
        // 计算属性依赖的值变化了，应该触发渲染
        triggerRefValue(this);
      }
    );
  }
  get value(): T {
    trackRefValue(this);
    // 在此进行缓存处理
    if (this.effect.dirty) {
      // 默认第一次是脏值
      this._value = this.effect.run(); // 执行一次run后，就不是脏值了，将值缓存起来
    }
    // 【非空断言 !】走到这里 _value 一定已被赋值,编译器推导不出时明确告诉它
    return this._value!;
  }

  set value(newValue: T) {
    this.setter(newValue);
  }
}

// 【函数重载】computed 的两种用法各一个签名(调用者可见),
// 第三个是实现签名(更宽松,调用者不可见),实现必须兼容所有重载
export function computed<T>(getter: ComputedGetter<T>): Ref<T>;
export function computed<T>(options: WritableComputedOptions<T>): Ref<T>;
export function computed<T>(
  getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>
): Ref<T> {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
