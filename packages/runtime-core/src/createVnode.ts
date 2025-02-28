import { isFunction, isObject, isString, ShapeFlags } from "@vue/share";
import { isTeleport } from "./components/Teleport";
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
export function createVnode(type, props, children?, patchFlag?) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isTeleport(type)
    ? ShapeFlags.TELEPORT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 组件
    : isFunction(type) // 函数式组件
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0;
  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    key: props?.key, // 进行diff算法比较时的key
    el: null, // 虚拟节点对应的真实节点
    shapeFlag,
    patchFlag,
  };
  // 收集动态节点
  if (currentBlock && patchFlag > 0) {
    currentBlock.push(vnode);
  }
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
// 用于收集动态节点
let currentBlock = null;

export function openBlock() {
  currentBlock = [];
}
export function closeBlock() {
  currentBlock = null;
}

export const setupBlock = (vnode) => {
  vnode.dynamicChildren = currentBlock;
  closeBlock();
  return vnode;
};

// 与createVnode不同的是,block能收集动态节点
export function createElementBlock(type, props, children, patchFlag?) {
  return setupBlock(createVnode(type, props, children, patchFlag));
}
export { createVnode as createElementVnode };
export function toDisplayString(val) {
  return isString(val)
    ? val
    : val == null
    ? ""
    : isObject(val)
    ? JSON.stringify(val)
    : String(val);
}
