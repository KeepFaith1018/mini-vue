import { isObject } from "@vue/share";
import {
  createVnode,
  isVnode,
  type VNode,
  type VNodeChild,
  type VNodeProps,
  type VNodeTypes,
} from "./createVnode";

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
// 【联合类型建模多态】第二、三个参数每个位置都有多种可能,用 | 并列
export function h(
  type: VNodeTypes,
  propsOrChildren?: VNodeProps | VNodeChild | VNodeChild[],
  children?: VNodeChild | VNodeChild[]
): VNode {
  let l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // single vnode without props
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      // props without children
      return createVnode(type, propsOrChildren as VNodeProps | null);
    } else {
      // omit props
      // 运行时这个分支只会拿到"孩子",按位置断言成 VNodeChild
      return createVnode(type, null, propsOrChildren as VNodeChild);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    // 走到这里第二个参数必定是 props,同样按位置断言
    return createVnode(type, propsOrChildren as VNodeProps | null, children);
  }
}
