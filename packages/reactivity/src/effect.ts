// 提供一个函数来记录副作用函数
export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
export let activeEffect;

function preCleanEffect(effect){
  effect._depslength=0;
  effect._trackId++; //每次执行，_trackId加1
}

class ReactiveEffect {
  _trackId = 0; // 记录当前effect执行了多少次
  _depslength=0;
  deps: any[] = []; // 依赖的集合
  
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

      // 在effect重新执行之前，清空之前的依赖
      preCleanEffect(this)
      return this.fn();
    } finally {
      // 当副作用函数执行完,就不需要在保存了,避免在我们指定的api之外,使用effect收集依赖
      activeEffect = undefined;
    }
  }
}
/**
 * 双向收集
 * @param effect 副作用函数收集被谁依赖
 * @param dep    依赖收集副作用函数
 */
export function trackEffect(effect, dep: any) {
  // 重写依赖收集，比较_trackId如果和依赖集中的不同，则重新收集依赖
  if(dep.get(effect) != effect._trackId){
    dep.set(effect,effect._trackId)
  }

  dep.set(effect,effect._trackId)
  effect.deps[effect._depslength++] = dep
}
/**
 * 触发更新，副作用函数重新执行
 * @param dep 依赖集
 */
export function triggerEffect(dep){
  for(const effect of dep.keys()){
    
    if(effect.scheduler){
        effect.scheduler()
    }
  }
}


