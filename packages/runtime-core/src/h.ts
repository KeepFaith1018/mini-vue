import { isObject } from "@vue/share";
import { createVnode, isVnode } from "./createVnode";

/**
 * 创建虚拟节点
 * 多态
 * 两个参数
 *  1. type props  h('div',{class: "box"})
 *  2. type children  h('div',h('a'))
 * 三个参数，或以上
 *  1. type props children  h('div',{class: "box"},h('a'))
 *  2. type props children1 children2
 */
export function h(type, propsOrChildren?, children?) {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // single vnode without props
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      // props without children
      return createVnode(type, propsOrChildren);
    } else {
      // omit props
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVnode(type, propsOrChildren, children);
  }
}
