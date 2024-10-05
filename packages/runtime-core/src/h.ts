import { isObject } from "@vue/share";
import { createVnode, isVnode } from "./createVnode";

/**
 * 创建虚拟节点
 * 多态
 * 两个参数
 *  1. type props  h('div',{class: "box"})
 *  2. type children  h('div',h('a'))
 */
export function h(type, propsOrChildren?, children?) {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // h('div',h('a'))
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      } else {
        // h('div',{class: "box"})
        return createVnode(type, propsOrChildren, null);
      }
    }
    return createVnode(type, null, [propsOrChildren]);
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}
