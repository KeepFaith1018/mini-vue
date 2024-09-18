// 提供一个函数来记录副作用函数
export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
export let activeEffect;
class ReactiveEffect {
  // 默认开启响应式
  public active: boolean = true;
  // fn 用户编写的函数
  constructor(public fn, public scheduler) {}

  run() {
    if (!this.active) {
      // 不是激活的,执行后什么都不做
      return this.fn();
    }

    try {
      activeEffect = this;
      return this.fn();
    } finally {
      // 当副作用函数执行完,就不需要在保存了,避免在我们指定的api之外,使用effect收集依赖
      activeEffect = undefined;
    }
  }
}

export function trackEffect(activeEffect, dep: any) {

}
