import { isFunction } from "@vue/share";
import { ReactiveEffect, triggerEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
  public _value;
  public effect; // 与依赖的值建立关联
  public dep; // 与其他依赖于计算属性的值建立关联
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      // 用调度器触发更新渲染
      () => {
        // 计算属性依赖的值变化了，应该触发渲染
        triggerRefValue(this);
      }
    );
  }
  get value() {
    // 在此进行缓存处理
    if (this.effect.dirty) {
      // 默认第一次是脏值
      this._value = this.effect.run(); // 执行一次run后，就不是脏值了，将值缓存起来
      // 收集依赖
      trackRefValue(this);
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  // computed 有两种使用方式，一种是副作用函数，一种是含有getter和setter的对象
  let onlyGetter = isFunction(getterOrOptions);
  let getter, setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
