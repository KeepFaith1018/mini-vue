import { activeEffect, trackEffect, triggerEffect } from "./effect"

// TODO: 在vue.js设计与实现中是 weakmap map set.视频教程中最后是map,解决?
// vue3.4之前是用set,之后为了进行清理操作,改成了effect
// 用来创建 key和effect的依赖关系,并可以清理不需要的属性

/**
 * 创建收集器 映射属性和副作用函数的容器
 * @param cleanup 清理函数，可以将这个属性对应的清除掉
 * @param key     属性名
 * @returns 
 */
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

export function trigger(target,key,newValue,oldValue){
    const depsMap = targetMap.get(target);
    if(!depsMap){
        // 找不到对象，直接返回
        return
    }
    const dep = depsMap.get(key);
    if(dep){
        triggerEffect(dep)
    }
}