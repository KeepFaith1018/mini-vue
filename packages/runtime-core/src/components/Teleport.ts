import { ShapeFlags } from "@vue/share";
import type { VNode, VNodeChild } from "../createVnode";
import type { ComponentInstance } from "../component";
import type { RendererElement, RendererNode } from "../renderer";

// Teleport 需要的渲染能力由 renderer 反向注入,接口声明这份"能力清单"
export interface TeleportInternals {
  mountChildren: (
    children: VNodeChild[],
    container: RendererElement,
    parentComponent: ComponentInstance | null
  ) => void;
  patchChildren: (
    oldVnode: VNode,
    newVnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInstance | null
  ) => void;
  move: (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererNode | null
  ) => void;
}

// 内置组件
export const Teleport = {
  _isTeleport: true,
  process(
    oldVnode: VNode | null,
    newVnode: VNode,
    // 挂载目标从 props.to 查询,形参 container 在原始代码中就未使用
    _container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInstance | null,
    internals: TeleportInternals
  ) {
    let { mountChildren, patchChildren, move } = internals;
    if (!oldVnode) {
      const target = (newVnode.target = document.querySelector(
        newVnode.props!.to as string
      ) as RendererElement | null);
      if (target) {
        mountChildren(
          newVnode.children as VNodeChild[],
          target,
          parentComponent
        );
      }
    } else {
      // 先更新子节点
      newVnode.target = oldVnode.target;
      patchChildren(
        oldVnode,
        newVnode,
        newVnode.target!,
        anchor,
        parentComponent
      );
      // 将子节点移动到对应的位置
      if (newVnode.props!.to !== oldVnode.props!.to) {
        const nextTarget = document.querySelector(
          newVnode.props!.to as string
        ) as RendererElement | null;
        (newVnode.children as VNodeChild[]).forEach((child) =>
          move(child as VNode, nextTarget!, anchor)
        );
        newVnode.target = nextTarget;
      }
    }
  },
  remove(
    vnode: VNode,
    unmountChildren: (
      children: VNode[],
      parentComponent: ComponentInstance | null
    ) => void
  ) {
    const { shapeFlag, children } = vnode;
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children as VNode[], null);
    }
  },
};

// 对象上挂品牌标记再判断,等价于 Vue 源码的 isTeleport 实现
export const isTeleport = (value: unknown): boolean =>
  !!(value as { _isTeleport?: boolean })?._isTeleport;
