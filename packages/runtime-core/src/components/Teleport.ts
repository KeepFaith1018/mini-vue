import { ShapeFlags } from "@vue/share";

// 内置组件
export const Teleport = {
  _isTeleport: true,
  process(oldVnode, newVnode, container, anchor, parentComponent, internals) {
    let { mountChildren, patchChildren, move } = internals;
    if (!oldVnode) {
      const target = (newVnode.target = document.querySelector(
        newVnode.props.to
      ));
      if (target) {
        mountChildren(newVnode.children, target, parentComponent);
      }
    } else {
      // 先更新子节点
      newVnode.target = oldVnode.target;
      patchChildren(
        oldVnode,
        newVnode,
        newVnode.target,
        anchor,
        parentComponent
      );
      // 将子节点移动到对应的位置
      if (newVnode.props.to !== oldVnode.props.to) {
        const nextTarget = document.querySelector(newVnode.props.to);
        newVnode.children.forEach((child) => move(child, nextTarget, anchor));
        newVnode.target = nextTarget;
      }
    }
  },
  remove(vnode, unmountChildren) {
    const { shapeFlag, children } = vnode;
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children, null);
    }
  },
};

export const isTeleport = (value) => !!value?._isTeleport;
