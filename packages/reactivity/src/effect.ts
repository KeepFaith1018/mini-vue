// 提供一个函数来记录副作用函数
export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}
export let activeEffect : ReactiveEffect | null;

function preCleanEffect(effect){
  effect._depslength=0;
  effect._trackId++; //每次执行，_trackId加1
}
function postCleanEffect(effect){
  if(effect.deps.length>effect._depslength){
    for(let i=effect._depslength;i<effect.deps.length;i++){
      cleanEffect(effect.deps[i],effect) // 从映射表中删除effect
    }
    effect.deps.length=effect._depslength
  }
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
    let lastEffect = activeEffect;
    try {
      activeEffect = this;

      // 在effect重新执行之前，清空之前的依赖
      preCleanEffect(this)
      return this.fn();
    } finally {
      // 当副作用函数执行完,就不需要在保存了,避免在我们指定的api之外,使用effect收集依赖
      activeEffect = lastEffect;
      // 如果之前的依赖多余新的依赖，会导致后面有多余的依赖
      postCleanEffect(this)
    }
  }
}

function cleanEffect(dep,effect){
  dep.delete(effect);
  if(dep.size==0){
    dep.cleanup()
  }
}
/**
 * 双向收集
 * @param effect 副作用函数收集被谁依赖
 * @param dep    依赖收集副作用函数
 */
export function trackEffect(effect, dep: any) {
  console.log("trackEffect", effect, dep)
  // 需要重新收集依赖，将不需要的依赖清空
  // 如果这两个值不同，需要重新收集依赖
  // 一种是，effect第一次默认执行 值分别为undifined 1
  // 之后修改属性的值，effect会被执行，trackid被修改，不同，则需重新收集依赖。
  // 在effect中访问三次同样的属性值，并不会重新收集，因为trackedid一样
  if(dep.get(effect) != effect._trackId){
    dep.set(effect,effect._trackId)
    // 考虑分支切换的问题，由于属性的修改，同一个effect依赖属性不同
    // document.querySelector(".box") = proxy.flag:flag.name?flag.age
    // {flag,name}
    // {flag,age}
    // 比较依赖，进行清理替换
    let oldDep = effect.deps[effect._depslength]
    if(oldDep !== dep){
      if(oldDep){
        cleanEffect(oldDep,effect)
      }
      effect.deps[effect._depslength++] = dep // 以新的为准
    }else{
      effect._depslength++
    }
  }

  // dep.set(effect,effect._trackId)
  // effect.deps[effect._depslength++] = dep
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


