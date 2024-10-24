import { isObject, isString, ShapeFlags } from "@vue/share";
export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
// 判断是否是相同的虚拟节点
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

// 判断是否是虚拟节点
export function isVnode(value) {
  return value?.__v_isVnode;
}
// 创建虚拟节点
export function createVnode(type, props, children?) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件
    : 0;
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key, // 进行diff算法比较时的key
    el: null, // 虚拟节点对应的真实节点
    shapeFlag,
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN; // 组件的孩子 插槽
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return vnode;
}
