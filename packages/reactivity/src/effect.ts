import { DirtyLevels } from "./constants";

// 提供一个函数来记录副作用函数
export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    // 默认的调度器 scheduler
    _effect.run();
  });
  _effect.run();
  // 自定义了调度器
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
export let activeEffect: ReactiveEffect | null;
// 执行前清理依赖
function preCleanEffect(effect) {
  effect._depslength = 0;
  effect._trackId++; //每次执行，_trackId加1
}
// 清理多余依赖
function postCleanEffect(effect) {
  if (effect.deps.length > effect._depslength) {
    for (let i = effect._depslength; i < effect.deps.length; i++) {
      cleanEffect(effect.deps[i], effect); // 从映射表中删除effect
    }
    effect.deps.length = effect._depslength;
  }
}

export class ReactiveEffect {
  _trackId = 0; // 记录当前effect执行了多少次
  _depslength = 0;
  _running = 0;
  _dirtyLevel = DirtyLevels.Dirty;
  deps: any[] = []; // 依赖的集合

  // 默认开启响应式
  public active: boolean = true;
  /**
   *
   * @param fn 用户创建的副作用函数，执行时会收集依赖，依赖变更会重新执行
   * @param scheduler 调度器，默认调用fn函数，也可以自定义处理逻辑
   */
  constructor(public fn, public scheduler) {}
  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }
  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }
  run() {
    this._dirtyLevel = DirtyLevels.NoDirty; // 每次运行后，变为不是脏值
    if (!this.active) {
      // 不是激活的,执行后什么都不做
      return this.fn();
    }
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      this._running++;
      // 在执行前，清空依赖（length设0，从头开始比较依赖属性），并trackid++，标识是新一次的effect执行
      preCleanEffect(this);
      return this.fn();
    } finally {
      this._running--;
      // 当副作用函数执行完,就不需要在保存了,避免在我们指定的api之外,使用effect收集依赖
      activeEffect = lastEffect;
      // 只能通过preCleanEffect来将本次的依赖正确的替换到deps前面（替换有限个），多余的通过下面函数清理
      postCleanEffect(this);
    }
  }
}

function cleanEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size == 0) {
    dep.cleanup();
  }
}
/**
 * 双向收集
 * @param effect 副作用函数收集被谁依赖
 * @param dep    依赖收集副作用函数
 */
export function trackEffect(effect, dep: any) {
  // 这两个值不一样，说明是不在同一次effect中，所以依赖需要重新收集更改，并且需要以新的dep为准
  // 避免了一次effect中因重复读取某个属性重复执行收集
  if (dep.get(effect) != effect._trackId) {
    dep.set(effect, effect._trackId);
    // 考虑分支切换的问题，由于属性的修改，同一个effect依赖属性不同
    // document.querySelector(".box") = proxy.flag:flag.name?flag.age
    // {flag,name}
    // {flag,age}
    // 比较依赖，进行清理替换
    let oldDep = effect.deps[effect._depslength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanEffect(oldDep, effect);
      }
      effect.deps[effect._depslength++] = dep; // 以新的为准
    } else {
      effect._depslength++;
    }
  }
}
/**
 * 触发更新，副作用函数重新执行
 * @param dep 依赖集
 */
export function triggerEffect(dep) {
  for (const effect of dep.keys()) {
    // 如果不是脏值，触发更新需要将值变为脏值

    // 属性依赖了计算属性，需要让计算属性的dirty在变为true
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty;
    }

    if (effect.scheduler) {
      if (!effect.running) {
        // 如果不是正在执行，则执行
        effect.scheduler();
      }
    }
  }
}
