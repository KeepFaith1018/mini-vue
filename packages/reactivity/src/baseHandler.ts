import { isObject } from "@vue/share";
import { track, trigger } from "./reactiveEffect";
import { reactive } from "./reactive";
import { ReactiveFlags } from "./contants";

// 响应式对象proxy的处理handler
export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    if (key == ReactiveFlags.IS_REACTIVE) return true;

    track(target, key);
    let res = Reflect.get(target, key, receiver);
    // 如果对象中的属性还是对象，则代理后返回 ；例如object{a:1,b:{a:1,c:2}}
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    let reseult = Reflect.set(target, key, value, receiver);
    if (oldValue != value) {
      // 值不同时，副作用函数重新执行
      trigger(target, key, value, oldValue);
    }

    return reseult;
  },
};
