import { activeEffect } from "./effect"

// TODO: 在vue.js设计与实现中是 weakmap map set.视频教程中最后是map,解决?
// vue3.4之前是用set,之后为了进行清理操作,改成了effect
// 用来创建 key和effect的依赖关系,并可以清理不需要的属性
export const creatDep = (cleanup,key) => {
    const dep  = new Map() as any;
    dep.cleanup = cleanup;
    dep.name = key;
    return dep
}



const targetMap = new WeakMap();
export function track(target, key) {
    // 有activeEffect这个属性,说明是在effect中访问的,不存在则不需要收集
    if(activeEffect){
        // 映射obj => property
        let depsMap = targetMap.get(target);
        if(!depsMap){
            targetMap.set(target,(depsMap = new Map()));
        }
        // 映射property => effect
        let dep = depsMap.get(key);
        if(!dep){
            depsMap.set(key,dep = creatDep(()=>depsMap.delete(key),key));
        }
        // 将effect和收集器关联起来
        trackEffect(activeEffect,dep)
        console.log(targetMap)
    }
}
