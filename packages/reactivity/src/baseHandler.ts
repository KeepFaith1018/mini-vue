
import {track, trigger} from "./reactiveEffect";

export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
// 响应式对象proxy的处理handler
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key == ReactiveFlags.IS_REACTIVE) return true;

    track(target, key);

    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const oldValue = target[key]
    let reseult = Reflect.set(target, key, value, receiver);
    if(oldValue != value){
        // 值不同时，副作用函数重新执行
        trigger(target,key,value,oldValue)
    }

    return reseult
  },
};
