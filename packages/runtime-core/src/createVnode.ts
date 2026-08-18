import { isFunction, isObject, isString, ShapeFlags } from "@vue/share";
import { isTeleport, type Teleport } from "./components/Teleport";
// 与 component/renderer 互相引用类型 —— import type 在编译后被擦除,不会产生运行时循环依赖
import type { AppContext, Component, ComponentInstance } from "./component";
import type { RendererElement, RendererNode } from "./renderer";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
// 判断是否是相同的虚拟节点
export function isSameVnode(n1: VNode, n2: VNode): boolean {
  return n1.type === n2.type && n1.key === n2.key;
}

// 判断是否是虚拟节点
// 【类型守卫】value is VNode:调用处自动收窄
export function isVnode(value: unknown): value is VNode {
  return !!(value as VNode)?.__v_isVnode;
}

/**
 * 【递归类型】children 里的每一项又可以是 VNodeChild 自己 ——
 * 类型像模板语法一样递归定义,业务里的树形结构(菜单、组织架构)同款写法
 */
export type VNodeChild =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | VNodeChild[];

/**
 * 【接口建模】VNode 的"户口本"。字段在创建时确定,
 * 后续 diff / 挂载 / 更新全部按这份契约访问
 */
export interface VNode {
  __v_isVnode: true;
  type: VNodeTypes;
  props: VNodeProps | null;
  children: VNodeNormalizedChildren;
  key: PropertyKey | null; // 进行diff算法比较时的key
  el: RendererNode | null; // 虚拟节点对应的真实节点
  shapeFlag: number;
  patchFlag?: number;
  component: ComponentInstance | null;
  appContext: AppContext | null;
  target?: RendererElement | null; // Teleport 的挂载目标
  dynamicChildren?: VNode[] | null; // block 收集的动态节点
  dynamicProps?: string[]; // 会变化的属性名,配合 patchFlag.PROPS 使用
}

/** 创建 VNode 时 type 的全部可能取值 */
export type VNodeTypes =
  | string
  | typeof Text
  | typeof Fragment
  | Component
  | typeof Teleport;

/** 模板里的属性对象:除 key 外不预先约定字段,用开放索引签名 */
export interface VNodeProps {
  key?: PropertyKey;
  [key: string]: unknown;
}

// 创建后归一化的子节点:文本 | 节点数组 | 插槽对象 | 空
export type VNodeNormalizedChildren =
  | string
  | VNodeChild[]
  | Record<string, unknown>
  | null;

// 创建虚拟节点
export function createVnode(
  type: VNodeTypes,
  props: VNodeProps | null,
  children?: VNodeNormalizedChildren | VNodeChild,
  patchFlag?: number
): VNode {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 元素
    : isTeleport(type)
      ? ShapeFlags.TELEPORT
      : isObject(type)
        ? ShapeFlags.STATEFUL_COMPONENT // 组件
        : isFunction(type) // 函数式组件
          ? ShapeFlags.FUNCTIONAL_COMPONENT
          : 0;
  const vnode: VNode = {
    __v_isVnode: true,
    type,
    props,
    // children 先占位为 null,下面归一化后再写回
    children: null,
    key: props?.key ?? null, // 进行diff算法比较时的key
    el: null, // 虚拟节点对应的真实节点
    shapeFlag,
    patchFlag,
    component: null,
    appContext: null,
  };
  // 收集动态节点
  if (currentBlock && (patchFlag ?? 0) > 0) {
    currentBlock.push(vnode);
  }
  if (children != null) {
    if (Array.isArray(children)) {
      vnode.children = children;
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else if (isObject(children)) {
      vnode.children = children; // 组件的孩子 插槽
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    } else {
      vnode.children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return vnode;
}

export function normalizeVNode(child: VNodeChild): VNode {
  if (isVnode(child)) return child;
  if (Array.isArray(child)) return createVnode(Fragment, null, child);
  if (child == null || typeof child === "boolean") {
    return createVnode(Text, null, "");
  }
  return createVnode(Text, null, String(child));
}
// 用于收集动态节点
let currentBlock: VNode[] | null = null;

export function openBlock(): void {
  currentBlock = [];
}
export function closeBlock(): void {
  currentBlock = null;
}

export const setupBlock = (vnode: VNode): VNode => {
  vnode.dynamicChildren = currentBlock;
  closeBlock();
  return vnode;
};

// 与createVnode不同的是,block能收集动态节点
export function createElementBlock(
  type: VNodeTypes,
  props: VNodeProps | null,
  children?: VNodeNormalizedChildren | VNodeChild,
  patchFlag?: number
): VNode {
  return setupBlock(createVnode(type, props, children, patchFlag));
}
export { createVnode as createElementVnode };
export function toDisplayString(val: unknown): string {
  return isString(val)
    ? val
    : val == null
      ? ""
      : isObject(val)
        ? JSON.stringify(val)
        : String(val);
}
